import { pool } from '../../config/db';

export const categoriesRepository = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  },
};
