import { pool } from '../../config/db';

function mapService(r: any) {
  return {
    id: r.id,
    providerId: r.provider_id,
    title: r.title,
    description: r.description,
    categoryId: r.category_id,
    price: Number(r.price),
    priceUnit: r.price_unit,
    latitude: r.latitude,
    longitude: r.longitude,
    serviceAreaKm: r.service_area_km,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export const servicesRepository = {
  async findAll(filters: { category?: string; q?: string; sort?: string }) {
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];

    if (filters.category) {
      params.push(filters.category);
      conditions.push(`category_id = $${params.length}`);
    }
    if (filters.q) {
      params.push(`%${filters.q}%`);
      conditions.push(`title ILIKE $${params.length}`);
    }

    let orderBy = 'created_at DESC';
    if (filters.sort === 'price_asc') orderBy = 'price ASC';
    if (filters.sort === 'price_desc') orderBy = 'price DESC';

    const { rows } = await pool.query(
      `SELECT * FROM services WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy}`,
      params
    );
    return rows.map(mapService);
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(providerId: string, input: any) {
    const { rows } = await pool.query(
      `INSERT INTO services (provider_id, title, description, category_id, price, price_unit, latitude, longitude, service_area_km)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [providerId, input.title, input.description ?? null, input.categoryId ?? null, input.price, input.priceUnit ?? 'forfait', input.latitude ?? null, input.longitude ?? null, input.serviceAreaKm ?? 10]
    );
    return mapService(rows[0]);
  },

  async update(id: string, input: any) {
    const { rows } = await pool.query(
      `UPDATE services SET
        title = COALESCE($2, title),
        description = COALESCE($3, description),
        category_id = COALESCE($4, category_id),
        price = COALESCE($5, price),
        price_unit = COALESCE($6, price_unit),
        latitude = COALESCE($7, latitude),
        longitude = COALESCE($8, longitude),
        service_area_km = COALESCE($9, service_area_km)
       WHERE id = $1 RETURNING *`,
      [id, input.title ?? null, input.description ?? null, input.categoryId ?? null, input.price ?? null, input.priceUnit ?? null, input.latitude ?? null, input.longitude ?? null, input.serviceAreaKm ?? null]
    );
    return mapService(rows[0]);
  },

  async softDelete(id: string) {
    await pool.query('UPDATE services SET is_active = false WHERE id = $1', [id]);
  },
};

export { mapService };
