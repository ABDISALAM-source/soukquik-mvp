import { pool } from '../../config/db';

function mapProduct(r: any) {
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    description: r.description,
    categoryId: r.category_id,
    brandId: r.brand_id ?? null,
    price: Number(r.price),
    stock: r.stock,
    imageUrl: r.image_url,
    tags: r.tags ?? [],
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
      `INSERT INTO products (shop_id, name, description, category_id, brand_id, price, stock, image_url, tags, image_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        shopId,
        input.name,
        input.description ?? null,
        input.categoryId ?? null,
        input.brandId ?? null,
        input.price,
        input.stock ?? 0,
        input.imageUrl ?? null,
        input.tags ?? [],
        input.imageHash ?? null,
      ]
    );
    return mapProduct(rows[0]);
  },

  async update(id: string, input: any) {
    const { rows } = await pool.query(
      `UPDATE products SET
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category_id = COALESCE($4, category_id),
        brand_id = COALESCE($5, brand_id),
        price = COALESCE($6, price),
        stock = COALESCE($7, stock),
        image_url = COALESCE($8, image_url),
        tags = COALESCE($9, tags),
        image_hash = COALESCE($10, image_hash)
       WHERE id = $1 RETURNING *`,
      [
        id,
        input.name ?? null,
        input.description ?? null,
        input.categoryId ?? null,
        input.brandId ?? null,
        input.price ?? null,
        input.stock ?? null,
        input.imageUrl ?? null,
        input.tags ?? null,
        input.imageHash ?? null,
      ]
    );
    return mapProduct(rows[0]);
  },

  async softDelete(id: string) {
    await pool.query('UPDATE products SET is_active = false WHERE id = $1', [id]);
  },

  async decrementStock(id: string, quantity: number) {
    await pool.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [id, quantity]);
  },

  // Fourchette de prix observée pour une catégorie (aide le vendeur à situer
  // son prix). min / médiane / max, produits actifs uniquement.
  async priceHint(categoryId: string) {
    const { rows } = await pool.query(
      `SELECT
         MIN(price)::numeric AS min,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY price)::numeric AS median,
         MAX(price)::numeric AS max,
         COUNT(*)::int AS n
       FROM products WHERE category_id = $1 AND is_active = true`,
      [categoryId]
    );
    const r = rows[0];
    return {
      count: r.n,
      min: r.min !== null ? Number(r.min) : null,
      median: r.median !== null ? Number(r.median) : null,
      max: r.max !== null ? Number(r.max) : null,
    };
  },
};

export { mapProduct };
