import { api } from './client';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export async function fetchNotifications() {
  const res = await api.get('/notifications');
  return res.data.data as AppNotification[];
}

export async function fetchUnreadCount() {
  const res = await api.get('/notifications/unread-count');
  return res.data.data as { count: number };
}

export async function markNotificationRead(id: string) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data.data as AppNotification;
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}
