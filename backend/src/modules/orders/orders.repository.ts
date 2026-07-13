import { pool } from '../../config/db';

function mapOrder(r: any) {
  return {
    id: r.id,
    clientId: r.client_id,
    shopId: r.shop_id,
    status: r.status,
    totalAmount: Number(r.total_amount),
    deliveryAddress: r.delivery_address,
    createdAt: r.created_at,
  };
}

export const ordersRepository = {
  async createWithItems(clientId: string, shopId: string, items: { productId: string; quantity: number; unitPrice: number }[], deliveryAddress?: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const total = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (client_id, shop_id, total_amount, delivery_address) VALUES ($1,$2,$3,$4) RETURNING *`,
        [clientId, shopId, total, deliveryAddress ?? null]
      );
      const order = orderRows[0];

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)`,
          [order.id, item.productId, item.quantity, item.unitPrice]
        );
        await client.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [item.productId, item.quantity]);
      }

      await client.query('COMMIT');
      return mapOrder(order);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findByClient(clientId: string) {
    const { rows } = await pool.query(
      `SELECT o.*, s.name AS shop_name FROM orders o
       JOIN shops s ON s.id = o.shop_id
       WHERE o.client_id = $1 ORDER BY o.created_at DESC`,
      [clientId]
    );
    return rows.map((r) => ({ ...mapOrder(r), shopName: r.shop_name }));
  },

  async findByShop(shopId: string) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE shop_id = $1 ORDER BY created_at DESC', [shopId]);
    return rows.map(mapOrder);
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async updateStatus(id: string, status: string) {
    const { rows } = await pool.query('UPDATE orders SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
    return mapOrder(rows[0]);
  },
};
