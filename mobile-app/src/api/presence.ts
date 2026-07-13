import { api } from './client';

export async function fetchShopPresence(shopId: string) {
  const res = await api.get(`/shops/${shopId}/presence`);
  return res.data.data as { count: number; appWideCount: number; intensity: number };
}

export async function enterShopPresence(shopId: string) {
  await api.post(`/shops/${shopId}/presence/enter`);
}

export async function leaveShopPresence(shopId: string) {
  await api.post(`/shops/${shopId}/presence/leave`);
}
