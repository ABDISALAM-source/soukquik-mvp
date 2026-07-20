import { pool } from '../../config/db';

function mapPromotion(r: any) {
  return {
    id: r.id,
    targetType: r.target_type,
    targetId: r.target_id,
    targetName: r.target_name ?? undefined,
    targetImage: r.target_image ?? undefined,
    targetShopId: r.target_shop_id ?? undefined,
    ownerId: r.owner_id,
    ownerName: r.owner_name ?? undefined,
    budget: Number(r.budget),
    status: r.status,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    impressions: r.impressions,
    clicks: r.clicks,
    createdAt: r.created_at,
  };
}

// Les promotions n'ont pas de copie publicitaire propre (pas de titre/image
// en base) : elles boostent la visibilité d'une boutique/service/produit
// existant, dont on va chercher le nom/visuel via ce join polymorphe selon
// target_type. shop_id n'a de sens que pour un produit (utile côté mobile
// pour naviguer vers ProductDetail, qui a besoin du shopId).
const TARGET_JOIN = `
  LEFT JOIN shops s ON p.target_type = 'shop' AND s.id = p.target_id
  LEFT JOIN services sv ON p.target_type = 'service' AND sv.id = p.target_id
  LEFT JOIN products pr ON p.target_type = 'product' AND pr.id = p.target_id
`;
const TARGET_FIELDS = `
  COALESCE(s.name, sv.title, pr.name) AS target_name,
  COALESCE(s.logo_url, pr.image_url) AS target_image,
  pr.shop_id AS target_shop_id
`;

export const promotionsRepository = {
  async create(ownerId: string, input: { targetType: string; targetId: string; budget: number; startsAt?: string; endsAt?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO promotions (target_type, target_id, owner_id, budget, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.targetType, input.targetId, ownerId, input.budget, input.startsAt ?? null, input.endsAt ?? null]
    );
    return mapPromotion(rows[0]);
  },

  async findByOwner(ownerId: string) {
    const { rows } = await pool.query(
      `SELECT p.*, ${TARGET_FIELDS} FROM promotions p ${TARGET_JOIN} WHERE p.owner_id = $1 ORDER BY p.created_at DESC`,
      [ownerId]
    );
    return rows.map(mapPromotion);
  },

  // Actives, pondérées par budget restant (budget élevé = plus souvent tirées) : rotation
  // aléatoire pondérée directement en SQL via ORDER BY random() ^ (1 / poids).
  async findActive(limit: number) {
    const { rows } = await pool.query(
      `SELECT p.*, ${TARGET_FIELDS} FROM promotions p
       ${TARGET_JOIN}
       WHERE p.status = 'active'
         AND (p.starts_at IS NULL OR p.starts_at <= now())
         AND (p.ends_at IS NULL OR p.ends_at >= now())
       ORDER BY random() ^ (1.0 / GREATEST(p.budget, 1)) DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map(mapPromotion);
  },

  async findRawById(id: string) {
    const { rows } = await pool.query('SELECT * FROM promotions WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async updateStatus(id: string, status: string) {
    const { rows } = await pool.query('UPDATE promotions SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return mapPromotion(rows[0]);
  },

  async incrementImpression(id: string) {
    await pool.query('UPDATE promotions SET impressions = impressions + 1 WHERE id = $1', [id]);
  },

  async incrementClick(id: string) {
    await pool.query('UPDATE promotions SET clicks = clicks + 1 WHERE id = $1', [id]);
  },

  // Vue admin : on ajoute le nom du vendeur/prestataire à l'origine de la
  // demande, pour ne pas avoir à modérer des UUID à l'aveugle.
  async listAll() {
    const { rows } = await pool.query(
      `SELECT p.*, ${TARGET_FIELDS}, u.full_name AS owner_name
       FROM promotions p
       ${TARGET_JOIN}
       LEFT JOIN users u ON u.id = p.owner_id
       ORDER BY p.created_at DESC`
    );
    return rows.map(mapPromotion);
  },
};
