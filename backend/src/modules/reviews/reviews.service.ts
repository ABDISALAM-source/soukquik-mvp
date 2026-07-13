import { Errors } from '../../common/errors';
import { reviewsRepository } from './reviews.repository';
import { CreateReviewInput } from './reviews.types';

export const reviewsService = {
  async create(authorId: string, input: CreateReviewInput) {
    const alreadyReviewed = await reviewsRepository.findByAuthorAndTarget(authorId, input.targetType, input.targetId);
    if (alreadyReviewed) throw Errors.conflict('Vous avez déjà laissé un avis pour cette cible');
    return reviewsRepository.create(authorId, input);
  },

  async listByTarget(targetType: string, targetId: string) {
    const [reviews, summary] = await Promise.all([
      reviewsRepository.findByTarget(targetType, targetId),
      reviewsRepository.summary(targetType, targetId),
    ]);
    return { reviews, summary };
  },

  async remove(id: string, authorId: string) {
    const review = await reviewsRepository.findRawById(id);
    if (!review) throw Errors.notFound('Avis introuvable');
    if (review.author_id !== authorId) throw Errors.forbidden("Vous n'êtes pas l'auteur de cet avis");
    await reviewsRepository.remove(id);
  },
};
