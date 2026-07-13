import { likesRepository } from './likes.repository';
import { TargetInput } from './likes.types';

export const likesService = {
  async toggle(userId: string, input: TargetInput) {
    const alreadyLiked = await likesRepository.exists(userId, input.targetType, input.targetId);
    if (alreadyLiked) {
      await likesRepository.remove(userId, input.targetType, input.targetId);
    } else {
      await likesRepository.add(userId, input.targetType, input.targetId);
    }
    const count = await likesRepository.count(input.targetType, input.targetId);
    return { liked: !alreadyLiked, count };
  },

  async count(input: TargetInput) {
    const count = await likesRepository.count(input.targetType, input.targetId);
    return { count };
  },

  async mine(userId: string, input: TargetInput) {
    const liked = await likesRepository.exists(userId, input.targetType, input.targetId);
    return { liked };
  },
};
