import { pool } from '../../config/db';

function mapBooking(r: any) {
  return {
    id: r.id,
    clientId: r.client_id,
    serviceId: r.service_id,
    status: r.status,
    scheduledAt: r.scheduled_at,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export const bookingsRepository = {
  async create(clientId: string, serviceId: string, scheduledAt: string | undefined, notes: string | undefined) {
    const { rows } = await pool.query(
      `INSERT INTO bookings (client_id, service_id, scheduled_at, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [clientId, serviceId, scheduledAt ?? null, notes ?? null]
    );
    return mapBooking(rows[0]);
  },

  async findByClient(clientId: string) {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
    return rows.map(mapBooking);
  },

  async findByService(serviceId: string) {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE service_id = $1 ORDER BY created_at DESC', [serviceId]);
    return rows.map(mapBooking);
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async updateStatus(id: string, status: string) {
    const { rows } = await pool.query('UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return mapBooking(rows[0]);
  },
};
