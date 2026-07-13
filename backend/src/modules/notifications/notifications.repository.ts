import { pool } from '../../config/db';

function mapNotification(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    payload: r.payload,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export const notificationsRepository = {
  async create(userId: string, type: string, payload: Record<string, unknown>) {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3) RETURNING *`,
      [userId, type, JSON.stringify(payload)]
    );
    return mapNotification(rows[0]);
  },

  async findByUser(userId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows.map(mapNotification);
  },

  async unreadCount(userId: string) {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
      [userId]
    );
    return rows[0].count as number;
  },

  async findRawById(id: string) {
    const { rows } = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async markRead(id: string) {
    const { rows } = await pool.query(
      'UPDATE notifications SET read_at = now() WHERE id = $1 AND read_at IS NULL RETURNING *',
      [id]
    );
    return rows[0] ? mapNotification(rows[0]) : null;
  },

  async markAllRead(userId: string) {
    await pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [userId]);
  },
};
