import { Errors } from '../../common/errors';
import { pool } from '../../config/db';
import { shopsRepository } from '../shops/shops.repository';
import { ordersRepository } from './orders.repository';
import { CreateOrderInput } from './orders.types';

export const ordersService = {
  async create(clientId: string, input: CreateOrderInput) {
    // Récupère prix + stock de chaque produit et valide
    const items: { productId: string; quantity: number; unitPrice: number }[] = [];
    for (const item of input.items) {
      const { rows } = await pool.query('SELECT id, price, stock, shop_id, is_active FROM products WHERE id = $1', [item.productId]);
      const product = rows[0];
      if (!product || !product.is_active) throw Errors.notFound(`Produit introuvable: ${item.productId}`);
      if (product.shop_id !== input.shopId) throw Errors.badRequest('Tous les produits doivent appartenir à la même boutique');
      if (product.stock < item.quantity) throw Errors.badRequest(`Stock insuffisant pour le produit ${item.productId}`);
      items.push({ productId: item.productId, quantity: item.quantity, unitPrice: Number(product.price) });
    }

    return ordersRepository.createWithItems(clientId, input.shopId, items, input.deliveryAddress);
  },

  listMine(clientId: string) {
    return ordersRepository.findByClient(clientId);
  },

  async listByShop(shopId: string, ownerId: string) {
    const shop = await shopsRepository.findRawById(shopId);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    return ordersRepository.findByShop(shopId);
  },

  async updateStatus(orderId: string, ownerId: string, status: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw Errors.notFound('Commande introuvable');
    const shop = await shopsRepository.findRawById(order.shop_id);
    if (!shop || shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    return ordersRepository.updateStatus(orderId, status);
  },
};
