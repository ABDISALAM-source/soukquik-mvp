import { pool } from '../../config/db';
import { haversineSql } from '../../common/geo';

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

  // Un prestataire n'est "à proximité" que dans la limite de sa propre
  // zone d'intervention (service_area_km) en plus du rayon demandé par le
  // client : LEAST(rayon demandé, zone du prestataire).
  async findNearby(lat: number, lng: number, radiusKm: number, limit: number) {
    const distanceExpr = haversineSql('$1', '$2', 'latitude', 'longitude');
    const { rows } = await pool.query(
      `SELECT * FROM (
         SELECT *, ${distanceExpr} AS distance_km
         FROM services
         WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL
       ) sub
       WHERE distance_km <= LEAST($3, COALESCE(service_area_km, $3))
       ORDER BY distance_km ASC
       LIMIT $4`,
      [lat, lng, radiusKm, limit]
    );
    return rows.map((r: any) => ({ ...mapService(r), distanceKm: Number(r.distance_km) }));
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

  // Équivalent de shopsRepository.analytics, mais agrégé sur TOUS les
  // services du prestataire (pas un seul id) puisque le dashboard
  // prestataire liste désormais plusieurs services.
  // Limite : le prix vient de la ligne services actuelle, pas d'un
  // instantané pris à la réservation (contrairement à order_items.unit_price
  // pour les commandes) — si le prestataire change son prix, le revenu des
  // réservations passées s'en trouve recalculé rétroactivement.
  async analyticsForProvider(providerId: string) {
    const { rows: serviceRows } = await pool.query(
      'SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active) ::int AS active FROM services WHERE provider_id = $1',
      [providerId]
    );
    const { rows: bookingRows } = await pool.query(
      `SELECT COUNT(*)::int AS total_bookings,
              COUNT(*) FILTER (WHERE b.status = 'pending')::int AS pending_bookings,
              COALESCE(SUM(s.price) FILTER (WHERE b.status = 'completed'),0)::numeric AS revenue_total,
              COALESCE(SUM(s.price) FILTER (WHERE b.status = 'completed' AND b.created_at::date = now()::date),0)::numeric AS revenue_today
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       WHERE s.provider_id = $1`,
      [providerId]
    );
    return {
      totalServices: serviceRows[0].total,
      activeServices: serviceRows[0].active,
      totalBookings: bookingRows[0].total_bookings,
      pendingBookings: bookingRows[0].pending_bookings,
      revenueTotal: Number(bookingRows[0].revenue_total),
      revenueToday: Number(bookingRows[0].revenue_today),
    };
  },
};

export { mapService };
