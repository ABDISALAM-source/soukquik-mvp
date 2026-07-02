import { Errors } from '../../common/errors';
import { shopsRepository } from './shops.repository';
import { CreateShopInput, UpdateShopInput } from './shops.types';

export const shopsService = {
  list(filters: { category?: string; q?: string }) {
    return shopsRepository.findAll(filters);
  },

  async getById(id: string) {
    const shop = await shopsRepository.findById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    return shop;
  },

  create(ownerId: string, input: CreateShopInput) {
    return shopsRepository.create(ownerId, input);
  },

  async update(id: string, ownerId: string, input: UpdateShopInput) {
    const shop = await shopsRepository.findRawById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    return shopsRepository.update(id, input);
  },

  async remove(id: string, ownerId: string) {
    const shop = await shopsRepository.findRawById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    await shopsRepository.softDelete(id);
  },

  async analytics(id: string, ownerId: string) {
    const shop = await shopsRepository.findRawById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    return shopsRepository.analytics(id);
  },
};
