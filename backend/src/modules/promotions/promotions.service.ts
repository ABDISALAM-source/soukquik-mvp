import { Errors } from '../../common/errors';
import { promotionsRepository } from './promotions.repository';
import { CreatePromotionInput } from './promotions.types';

const DEFAULT_ACTIVE_LIMIT = 5;

export const promotionsService = {
  create(ownerId: string, input: CreatePromotionInput) {
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
