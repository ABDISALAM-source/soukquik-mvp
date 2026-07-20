import { pool } from '../../config/db';

export const authRepository = {
  async findByEmail(email: string) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async emailOrPhoneExists(email: string, phone: string) {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    return rows.length > 0;
  },

  // phone nullable : les comptes créés via Google OAuth n'en ont pas
  // (colonne UNIQUE mais nullable — Postgres autorise plusieurs NULL).
  async createUser(params: { fullName: string; email: string; phone: string | null; passwordHash: string; role: string; avatarUrl?: string | null }) {
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [params.fullName, params.email, params.phone, params.passwordHash, params.role, params.avatarUrl ?? null]
    );
    return rows[0];
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },
};
