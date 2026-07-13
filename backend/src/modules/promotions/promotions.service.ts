import { Errors } from '../../common/errors';
import { shopsRepository } from '../shops/shops.repository';
import { servicesRepository } from '../services/services.repository';
import { productsRepository } from '../products/products.repository';
import { promotionsRepository } from './promotions.repository';
import { CreatePromotionInput } from './promotions.types';

const DEFAULT_ACTIVE_LIMIT = 5;

// Une promotion booste la visibilité d'une cible existante : sans ce
// contrôle, n'importe quel vendeur/prestataire pourrait faire la publicité
// (et gonfler les stats d'impressions/clics) d'une boutique, d'un service
// ou d'un produit qui ne lui appartient pas.
async function assertOwnsTarget(ownerId: string, targetType: string, targetId: string) {
  if (targetType === 'shop') {
    const shop = await shopsRepository.findRawById(targetId);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
  } else if (targetType === 'product') {
    const product = await productsRepository.findById(targetId);
    if (!product) throw Errors.notFound('Produit introuvable');
    const shop = await shopsRepository.findRawById(product.shopId);
    if (!shop || shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce produit");
  } else if (targetType === 'service') {
    const service = await servicesRepository.findById(targetId);
    if (!service) throw Errors.notFound('Service introuvable');
    if (service.providerId !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de ce service");
  }
}

export const promotionsService = {
  async create(ownerId: string, input: CreatePromotionInput) {
    await assertOwnsTarget(ownerId, input.targetType, input.targetId);
    return promotionsRepository.create(ownerId, input);
  },

  listMine(ownerId: string) {
    return promotionsRepository.findByOwner(ownerId);
  },

  listActive(limit = DEFAULT_ACTIVE_LIMIT) {
    return promotionsRepository.findActive(limit);
  },

  listAll() {
    return promotionsRepository.listAll();
  },

  async updateStatus(id: string, status: string) {
    const promotion = await promotionsRepository.findRawById(id);
    if (!promotion) throw Errors.notFound('Promotion introuvable');
    return promotionsRepository.updateStatus(id, status);
  },

  async trackImpression(id: string) {
    const promotion = await promotionsRepository.findRawById(id);
    if (!promotion) throw Errors.notFound('Promotion introuvable');
    await promotionsRepository.incrementImpression(id);
  },

  async trackClick(id: string) {
    const promotion = await promotionsRepository.findRawById(id);
    if (!promotion) throw Errors.notFound('Promotion introuvable');
    await promotionsRepository.incrementClick(id);
  },
};
