import { Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { ok } from '../../common/response';

const statusSchema = z.object({ isActive: z.boolean() });

export const adminController = {
  async listUsers(req: Request, res: Response) {
    const { role } = req.query;
    const params: any[] = [];
    let where = '';
    if (role) {
      params.push(role);
      where = 'WHERE role = $1';
    }
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, created_at FROM users ${where} ORDER BY created_at DESC`,
      params
    );
    return ok(res, rows);
  },

  async updateUserStatus(req: Request, res: Response) {
    const { isActive } = statusSchema.parse(req.body);
    const { rows } = await pool.query(
      'UPDATE users SET is_active = $2 WHERE id = $1 RETURNING id, full_name, email, is_active',
      [req.params.id, isActive]
    );
    return ok(res, rows[0]);
  },

  async stats(_req: Request, res: Response) {
    const [{ rows: users }, { rows: shops }, { rows: services }, { rows: orders }, { rows: bookings }] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM users'),
      pool.query('SELECT COUNT(*)::int AS count FROM shops WHERE is_active = true'),
      pool.query('SELECT COUNT(*)::int AS count FROM services WHERE is_active = true'),
      pool.query('SELECT COUNT(*)::int AS count FROM orders'),
      pool.query('SELECT COUNT(*)::int AS count FROM bookings'),
    ]);
    return ok(res, {
      totalUsers: users[0].count,
      totalShops: shops[0].count,
      totalServices: services[0].count,
      totalOrders: orders[0].count,
      totalBookings: bookings[0].count,
    });
  },
};
