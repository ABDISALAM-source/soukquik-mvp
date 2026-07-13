import { pool } from '../../config/db';

function mapPromotion(r: any) {
  return {
    id: r.id,
    targetType: r.target_type,
    targetId: r.target_id,
    ownerId: r.owner_id,
    budget: Number(r.budget),
    status: r.status,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    impressions: r.impressions,
    clicks: r.clicks,
    createdAt: r.created_at,
  };
}

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
    const { rows } = await pool.query('SELECT * FROM promotions WHERE owner_id = $1 ORDER BY created_at DESC', [ownerId]);
    return rows.map(mapPromotion);
  },

  // Actives, pondérées par budget restant (budget élevé = plus souvent tirées) : rotation
  // aléatoire pondérée directement en SQL via ORDER BY random() ^ (1 / poids).
  async findActive(limit: number) {
    const { rows } = await pool.query(
      `SELECT * FROM promotions
       WHERE status = 'active'
         AND (starts_at IS NULL OR starts_at <= now())
         AND (ends_at IS NULL OR ends_at >= now())
       ORDER BY random() ^ (1.0 / GREATEST(budget, 1)) DESC
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

  async listAll() {
    const { rows } = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
    return rows.map(mapPromotion);
  },
};
