import { pool } from '../../config/db';

function mapReview(r: any) {
  return {
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    targetType: r.target_type,
    targetId: r.target_id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  };
}

export const reviewsRepository = {
  async findByAuthorAndTarget(authorId: string, targetType: string, targetId: string) {
    const { rows } = await pool.query(
      'SELECT 1 FROM reviews WHERE author_id = $1 AND target_type = $2 AND target_id = $3',
      [authorId, targetType, targetId]
    );
    return rows.length > 0;
  },

  async create(authorId: string, input: { targetType: string; targetId: string; rating: number; comment?: string }) {
    const { rows } = await pool.query(
      `INSERT INTO reviews (author_id, target_type, target_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [authorId, input.targetType, input.targetId, input.rating, input.comment ?? null]
    );
    return mapReview({ ...rows[0], author_name: null });
  },

  async findByTarget(targetType: string, targetId: string) {
    const { rows } = await pool.query(
      `SELECT r.*, u.full_name AS author_name
       FROM reviews r JOIN users u ON u.id = r.author_id
       WHERE r.target_type = $1 AND r.target_id = $2
       ORDER BY r.created_at DESC`,
      [targetType, targetId]
    );
    return rows.map(mapReview);
  },

  async summary(targetType: string, targetId: string) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average
       FROM reviews WHERE target_type = $1 AND target_id = $2`,
      [targetType, targetId]
    );
    return { count: rows[0].count as number, average: Number(rows[0].average) };
  },

  async findRawById(id: string) {
    const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async remove(id: string) {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
  },
};
