import { pool } from '../../config/db';

export const likesRepository = {
  async exists(userId: string, targetType: string, targetId: string) {
    const { rows } = await pool.query(
      'SELECT 1 FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3',
      [userId, targetType, targetId]
    );
    return rows.length > 0;
  },

  async add(userId: string, targetType: string, targetId: string) {
    await pool.query(
      'INSERT INTO likes (user_id, target_type, target_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, targetType, targetId]
    );
  },

  async remove(userId: string, targetType: string, targetId: string) {
    await pool.query('DELETE FROM likes WHERE user_id = $1 AND target_type = $2 AND target_id = $3', [
      userId,
      targetType,
      targetId,
    ]);
  },

  async count(targetType: string, targetId: string) {
    const { rows } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM likes WHERE target_type = $1 AND target_id = $2',
      [targetType, targetId]
    );
    return rows[0].count as number;
  },

  async findByUser(userId: string, targetType?: string) {
    const params: any[] = [userId];
    let extra = '';
    if (targetType) {
      params.push(targetType);
      extra = `AND target_type = $${params.length}`;
    }
    const { rows } = await pool.query(
      `SELECT target_type, target_id, created_at FROM likes WHERE user_id = $1 ${extra} ORDER BY created_at DESC`,
      params
    );
    return rows.map((r) => ({ targetType: r.target_type, targetId: r.target_id, createdAt: r.created_at }));
  },
};
