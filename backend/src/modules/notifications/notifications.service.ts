import { Errors } from '../../common/errors';
import { notificationsRepository } from './notifications.repository';

export const notificationsService = {
  /** Utilisé par d'autres modules (orders, bookings...) pour notifier un utilisateur — pas exposé directement en HTTP. */
  create(userId: string, type: string, payload: Record<string, unknown> = {}) {
    return notificationsRepository.create(userId, type, payload);
  },

  list(userId: string) {
    return notificationsRepository.findByUser(userId);
  },

  async unreadCount(userId: string) {
    const count = await notificationsRepository.unreadCount(userId);
    return { count };
  },

  async markRead(id: string, userId: string) {
    const notification = await notificationsRepository.findRawById(id);
    if (!notification) throw Errors.notFound('Notification introuvable');
    if (notification.user_id !== userId) throw Errors.forbidden("Cette notification ne vous appartient pas");
    return notificationsRepository.markRead(id);
  },

  async markAllRead(userId: string) {
    await notificationsRepository.markAllRead(userId);
  },
};
