import { pool } from '../../config/db';

export const presenceRepository = {
  async enter(shopId: string, userId: string) {
    // Referme toute session déjà ouverte pour ce user dans cette boutique
    // (cas où "leave" n'a jamais été appelé, ex: app fermée brutalement)
    // avant d'en ouvrir une nouvelle — évite d'accumuler des doublons.
    await pool.query(
      'UPDATE shop_presence SET left_at = now() WHERE shop_id = $1 AND user_id = $2 AND left_at IS NULL',
      [shopId, userId]
    );
    const { rows } = await pool.query(
      'INSERT INTO shop_presence (shop_id, user_id) VALUES ($1, $2) RETURNING *',
      [shopId, userId]
    );
    return rows[0];
  },

  async leave(shopId: string, userId: string) {
    await pool.query(
      'UPDATE shop_presence SET left_at = now() WHERE shop_id = $1 AND user_id = $2 AND left_at IS NULL',
      [shopId, userId]
    );
  },

  async activeCount(shopId: string) {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM shop_presence WHERE shop_id = $1 AND left_at IS NULL',
      [shopId]
    );
    return rows[0].count as number;
  },

  async activeUsersAppWide() {
    const { rows } = await pool.query(
      'SELECT COUNT(DISTINCT user_id)::int AS count FROM shop_presence WHERE left_at IS NULL'
    );
    return rows[0].count as number;
  },
};
