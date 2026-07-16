import { pool } from '../../config/db';

function mapCategory(r: any) {
  return { id: r.id, name: r.name, type: r.type, icon: r.icon, parentId: r.parent_id ?? null };
}

export const categoriesRepository = {
  async findAll() {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return rows.map(mapCategory);
  },

  // Catégories racines uniquement (parent_id NULL) — 1er niveau du sélecteur.
  async findRoots() {
    const { rows } = await pool.query('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name ASC');
    return rows.map(mapCategory);
  },

  // Sous-catégories d'une catégorie donnée (ex: Mode -> Chemise, Pantalon...).
  async findByParent(parentId: string) {
    const { rows } = await pool.query('SELECT * FROM categories WHERE parent_id = $1 ORDER BY name ASC', [parentId]);
    return rows.map(mapCategory);
  },
};
