import { pool } from '../../config/db';

// Fenêtre anti-gonflage : on ne recompte pas une vue du même utilisateur sur
// la même cible avant 30 min. Les vues anonymes (viewer nul) sont toujours
// insérées (pas d'identité pour dédupliquer).
const DEDUP_MINUTES = 30;

async function recordEvent(table: string, targetCol: string, targetId: string, viewerCol: string, viewerId: string | null) {
  if (viewerId) {
    const { rows } = await pool.query(
      `SELECT 1 FROM ${table}
       WHERE ${targetCol} = $1 AND ${viewerCol} = $2 AND created_at > now() - interval '${DEDUP_MINUTES} minutes'
       LIMIT 1`,
      [targetId, viewerId]
    );
    if (rows.length > 0) return;
  }
  await pool.query(`INSERT INTO ${table} (${targetCol}, ${viewerCol}) VALUES ($1, $2)`, [targetId, viewerId]);
}

export const analyticsRepository = {
  recordProductView(productId: string, viewerId: string | null) {
    return recordEvent('product_views', 'product_id', productId, 'viewer_id', viewerId);
  },
  recordShopVisit(shopId: string, visitorId: string | null) {
    return recordEvent('shop_visits', 'shop_id', shopId, 'visitor_id', visitorId);
  },
  recordServiceVisit(serviceId: string, visitorId: string | null) {
    return recordEvent('service_visits', 'service_id', serviceId, 'visitor_id', visitorId);
  },

  // Nombre total de ventes (unités vendues, hors commandes annulées) d'une
  // boutique, à partir des lignes de commande.
  async shopSalesCount(shopId: string) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(oi.quantity),0)::int AS sales
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE p.shop_id = $1 AND o.status <> 'cancelled'`,
      [shopId]
    );
    return rows[0].sales as number;
  },

  async shopViewsCount(shopId: string) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM shop_visits WHERE shop_id = $1', [shopId]);
    return rows[0].c as number;
  },

  // Stats de visite du dashboard : aujourd'hui + 7 derniers jours + série
  // quotidienne (7 points) pour un mini-graphe.
  async shopVisitStats(shopId: string) {
    const { rows: totals } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at::date = now()::date)::int AS today,
         COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS last7d
       FROM shop_visits WHERE shop_id = $1`,
      [shopId]
    );
    const { rows: series } = await pool.query(
      `SELECT d::date AS day, COALESCE(v.c, 0)::int AS count
       FROM generate_series(now()::date - interval '6 days', now()::date, interval '1 day') d
       LEFT JOIN (
         SELECT created_at::date AS day, COUNT(*) AS c
         FROM shop_visits WHERE shop_id = $1 AND created_at > now() - interval '7 days'
         GROUP BY created_at::date
       ) v ON v.day = d::date
       ORDER BY day`,
      [shopId]
    );
    return {
      visitsToday: totals[0].today,
      visits7d: totals[0].last7d,
      series: series.map((r: any) => ({ day: r.day, count: r.count })),
    };
  },

  async serviceVisitStats(providerId: string) {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE sv.created_at::date = now()::date)::int AS today,
         COUNT(*) FILTER (WHERE sv.created_at > now() - interval '7 days')::int AS last7d
       FROM service_visits sv
       JOIN services s ON s.id = sv.service_id
       WHERE s.provider_id = $1`,
      [providerId]
    );
    return { visitsToday: rows[0].today, visits7d: rows[0].last7d };
  },

  // Classement popularité des boutiques : ventes récentes (30 j) + visites
  // récentes (7 j), pondérées (une vente pèse plus qu'une visite). Sert la
  // rangée "En ce moment" de l'accueil.
  async trendingShops(limit: number) {
    const { rows } = await pool.query(
      `SELECT s.*,
              COALESCE(sales.n, 0)::int AS recent_sales,
              COALESCE(visits.n, 0)::int AS recent_visits,
              (COALESCE(sales.n,0) * 5 + COALESCE(visits.n,0)) AS popularity
       FROM shops s
       LEFT JOIN (
         SELECT p.shop_id, SUM(oi.quantity) AS n
         FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN products p ON p.id = oi.product_id
         WHERE o.status <> 'cancelled' AND o.created_at > now() - interval '30 days'
         GROUP BY p.shop_id
       ) sales ON sales.shop_id = s.id
       LEFT JOIN (
         SELECT shop_id, COUNT(*) AS n FROM shop_visits WHERE created_at > now() - interval '7 days' GROUP BY shop_id
       ) visits ON visits.shop_id = s.id
       WHERE s.is_active = true
       ORDER BY popularity DESC, s.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  async trendingServices(limit: number) {
    const { rows } = await pool.query(
      `SELECT s.*,
              COALESCE(b.n,0)::int AS recent_bookings,
              COALESCE(v.n,0)::int AS recent_visits,
              (COALESCE(b.n,0) * 5 + COALESCE(v.n,0)) AS popularity
       FROM services s
       LEFT JOIN (
         SELECT service_id, COUNT(*) AS n FROM bookings
         WHERE status <> 'cancelled' AND created_at > now() - interval '30 days' GROUP BY service_id
       ) b ON b.service_id = s.id
       LEFT JOIN (
         SELECT service_id, COUNT(*) AS n FROM service_visits WHERE created_at > now() - interval '7 days' GROUP BY service_id
       ) v ON v.service_id = s.id
       WHERE s.is_active = true
       ORDER BY popularity DESC, s.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },

  // Produits d'une boutique classés par popularité (ventes + vues récentes),
  // pour la rangée "les plus vus/vendus de cette boutique".
  async popularProductsByShop(shopId: string, limit: number) {
    const { rows } = await pool.query(
      `SELECT p.*,
              COALESCE(sales.n,0)::int AS sales_count,
              COALESCE(views.n,0)::int AS views_count,
              (COALESCE(sales.n,0) * 5 + COALESCE(views.n,0)) AS popularity
       FROM products p
       LEFT JOIN (
         SELECT oi.product_id, SUM(oi.quantity) AS n
         FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.status <> 'cancelled' GROUP BY oi.product_id
       ) sales ON sales.product_id = p.id
       LEFT JOIN (
         SELECT product_id, COUNT(*) AS n FROM product_views WHERE created_at > now() - interval '30 days' GROUP BY product_id
       ) views ON views.product_id = p.id
       WHERE p.shop_id = $1 AND p.is_active = true
       ORDER BY popularity DESC, p.created_at DESC
       LIMIT $2`,
      [shopId, limit]
    );
    return rows;
  },
};
