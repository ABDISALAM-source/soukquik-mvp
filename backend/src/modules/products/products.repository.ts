import { pool } from '../../config/db';

function mapProduct(r: any) {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    description: r.description,
    categoryId: r.category_id,
    price: Number(r.price),
    stock: r.stock,
    imageUrl: r.image_url,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export const productsRepository = {
  async findByShop(shopId: string) {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE shop_id = $1 AND is_active = true ORDER BY created_at DESC',
      [shopId]
    );
    return rows.map(mapProduct);
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(shopId: string, input: any) {
    const { rows } = await pool.query(
      `INSERT INTO products (shop_id, name, description, category_id, price, stock, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [shopId, input.name, input.description ?? null, input.categoryId ?? null, input.price, input.stock ?? 0, input.imageUrl ?? null]
    );
    return mapProduct(rows[0]);
  },

  async update(id: string, input: any) {
    const { rows } = await pool.query(
      `UPDATE products SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category_id = COALESCE($4, category_id),
        price = COALESCE($5, price),
        stock = COALESCE($6, stock),
        image_url = COALESCE($7, image_url)
       WHERE id = $1 RETURNING *`,
      [id, input.name ?? null, input.description ?? null, input.categoryId ?? null, input.price ?? null, input.stock ?? null, input.imageUrl ?? null]
    );
    return mapProduct(rows[0]);
  },

  async softDelete(id: string) {
    await pool.query('UPDATE products SET is_active = false WHERE id = $1', [id]);
  },

  async decrementStock(id: string, quantity: number) {
    await pool.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [id, quantity]);
  },
};

export { mapProduct };
