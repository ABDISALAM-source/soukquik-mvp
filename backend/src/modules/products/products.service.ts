import { Errors } from '../../common/errors';
import { shopsRepository } from '../shops/shops.repository';
import { productsRepository, mapProduct } from './products.repository';
import { CreateProductInput, UpdateProductInput } from './products.types';

async function assertShopOwner(shopId: string, ownerId: string) {
  const shop = await shopsRepository.findRawById(shopId);
  if (!shop) throw Errors.notFound('Boutique introuvable');
  if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
  return shop;
}

async function assertProductOwner(productId: string, ownerId: string) {
  const product = await productsRepository.findById(productId);
  if (!product) throw Errors.notFound('Produit introuvable');
  const shop = await shopsRepository.findRawById(product.shop_id);
  if (!shop || shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce produit");
  return product;
}

export const productsService = {
  listByShop(shopId: string) {
    return productsRepository.findByShop(shopId);
  },

  async create(shopId: string, ownerId: string, input: CreateProductInput) {
    await assertShopOwner(shopId, ownerId);
    return productsRepository.create(shopId, input);
  },

  async update(productId: string, ownerId: string, input: UpdateProductInput) {
    await assertProductOwner(productId, ownerId);
    return productsRepository.update(productId, input);
  },

  async remove(productId: string, ownerId: string) {
    await assertProductOwner(productId, ownerId);
    await productsRepository.softDelete(productId);
  },

  async getById(productId: string) {
    const product = await productsRepository.findById(productId);
    if (!product) throw Errors.notFound('Produit introuvable');
    return mapProduct(product);
  },

  priceHint(categoryId: string) {
    return productsRepository.priceHint(categoryId);
  },
};
