import { presenceRepository } from './presence.repository';

export const presenceService = {
  enter(shopId: string, userId: string) {
    return presenceRepository.enter(shopId, userId);
  },

  leave(shopId: string, userId: string) {
    return presenceRepository.leave(shopId, userId);
  },

  async count(shopId: string) {
    const [shopCount, appWideCount] = await Promise.all([
      presenceRepository.activeCount(shopId),
      presenceRepository.activeUsersAppWide(),
    ]);
    // Ratio de démo utilisé par la Phase 2 pour l'intensité de l'anneau de
    // présence — le calcul temps réel complet (sessions qui expirent toutes
    // seules, push WebSocket) arrive en Phase 8.
    const intensity = appWideCount > 0 ? Math.min(shopCount / appWideCount, 1) : 0;
    return { count: shopCount, appWideCount, intensity };
  },
};
