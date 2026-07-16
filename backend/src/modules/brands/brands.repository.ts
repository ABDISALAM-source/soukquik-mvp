import { pool } from '../../config/db';

function mapBrand(r: any) {
  return { id: r.id, name: r.name, logoUrl: r.logo_url ?? null };
}

export const brandsRepository = {
  // Recherche par préfixe insensible à la casse, pour l'autocomplétion.
  async search(q: string, limit: number) {
    const { rows } = await pool.query(
      'SELECT * FROM brands WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2',
      [`${q}%`, limit]
    );
    return rows.map(mapBrand);
  },

  async findByNameCI(name: string) {
    const { rows } = await pool.query('SELECT * FROM brands WHERE lower(name) = lower($1) LIMIT 1', [name]);
    return rows[0] ? mapBrand(rows[0]) : null;
  },

  async create(name: string) {
    const { rows } = await pool.query('INSERT INTO brands (name) VALUES ($1) RETURNING *', [name]);
    return mapBrand(rows[0]);
  },
};
