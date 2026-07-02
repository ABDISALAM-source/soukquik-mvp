import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { ok } from '../../common/response';
import { Errors } from '../../common/errors';

const updateMeSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
});

export const usersController = {
  async getById(req: Request, res: Response) {
    const { rows } = await pool.query('SELECT id, full_name, email, role, avatar_url FROM users WHERE id = $1', [req.params.id]);
    if (!rows[0]) throw Errors.notFound('Utilisateur introuvable');
    return ok(res, rows[0]);
  },

  async updateMe(req: Request, res: Response) {
    const input = updateMeSchema.parse(req.body);
    const { rows } = await pool.query(
      `UPDATE users SET full_name = COALESCE($2, full_name), avatar_url = COALESCE($3, avatar_url) WHERE id = $1
       RETURNING id, full_name, email, role, avatar_url`,
      [req.user!.id, input.fullName ?? null, input.avatarUrl ?? null]
    );
    return ok(res, rows[0]);
  },
};
