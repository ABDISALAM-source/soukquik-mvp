import { pool } from '../../config/db';
import { haversineSql } from '../../common/geo';

function mapShop(r: any) {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    description: r.description,
    categoryId: r.category_id,
    latitude: r.latitude,
    longitude: r.longitude,
    address: r.address,
    logoUrl: r.logo_url,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export const shopsRepository = {
  async findAll(filters: { category?: string; q?: string }) {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`category_id = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    const { rows } = await pool.query(
      `SELECT * FROM shops WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    );
    return rows.map(mapShop);
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
    return rows[0] ? mapShop(rows[0]) : null;
  },

  async findRawById(id: string) {
    const { rows } = await pool.query('SELECT * FROM shops WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findNearby(lat: number, lng: number, radiusKm: number, limit: number) {
    const distanceExpr = haversineSql('$1', '$2', 'latitude', 'longitude');
    const { rows } = await pool.query(
      `SELECT * FROM (
         SELECT *, ${distanceExpr} AS distance_km
         FROM shops
         WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
       ) sub
       WHERE distance_km <= $3
       ORDER BY distance_km ASC
       LIMIT $4`,
      [lat, lng, radiusKm, limit]
    );
    return rows.map((r: any) => ({ ...mapShop(r), distanceKm: Number(r.distance_km) }));
  },

  async create(ownerId: string, input: any) {
    const { rows } = await pool.query(
      `INSERT INTO shops (owner_id, name, description, category_id, latitude, longitude, address, logo_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [ownerId, input.name, input.description ?? null, input.categoryId ?? null, input.latitude ?? null, input.longitude ?? null, input.address ?? null, input.logoUrl ?? null]
    );
    return mapShop(rows[0]);
  },

  async update(id: string, input: any) {
    const { rows } = await pool.query(
      `UPDATE shops SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category_id = COALESCE($4, category_id),
        latitude = COALESCE($5, latitude),
        longitude = COALESCE($6, longitude),
        address = COALESCE($7, address),
        logo_url = COALESCE($8, logo_url)
       WHERE id = $1 RETURNING *`,
      [id, input.name ?? null, input.description ?? null, input.categoryId ?? null, input.latitude ?? null, input.longitude ?? null, input.address ?? null, input.logoUrl ?? null]
    );
    return mapShop(rows[0]);
  },

  async softDelete(id: string) {
    await pool.query('UPDATE shops SET is_active = false WHERE id = $1', [id]);
  },

  async analytics(shopId: string) {
    const { rows: productRows } = await pool.query(
      'SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active) ::int AS active FROM products WHERE shop_id = $1',
      [shopId]
    );
    const { rows: orderRows } = await pool.query(
      `SELECT COUNT(*)::int AS total_orders,
              COALESCE(SUM(total_amount),0)::numeric AS revenue_total,
              COUNT(*) FILTER (WHERE created_at::date = now()::date)::int AS orders_today,
              COALESCE(SUM(total_amount) FILTER (WHERE created_at::date = now()::date AND status != 'cancelled'),0)::numeric AS revenue_today
       FROM orders WHERE shop_id = $1`,
      [shopId]
    );
    return {
      totalProducts: productRows[0].total,
      activeProducts: productRows[0].active,
      totalOrders: orderRows[0].total_orders,
      revenueTotal: Number(orderRows[0].revenue_total),
      revenueToday: Number(orderRows[0].revenue_today),
      ordersToday: orderRows[0].orders_today,
    };
  },
};
