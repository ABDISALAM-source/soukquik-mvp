import { api } from './client';

export type PromotionTargetType = 'shop' | 'service' | 'product';
export type PromotionStatus = 'pending' | 'active' | 'expired';

export interface Promotion {
  id: string;
  targetType: PromotionTargetType;
  targetId: string;
  targetName?: string;
  targetImage?: string;
  targetShopId?: string;
  ownerId: string;
  ownerName?: string;
  budget: number;
  status: PromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export async function fetchActivePromotions(limit?: number) {
  const res = await api.get('/promotions/active', { params: limit ? { limit } : undefined });
  return res.data.data as Promotion[];
}

export async function fetchMyPromotions() {
  const res = await api.get('/promotions/mine');
  return res.data.data as Promotion[];
}

export async function fetchAllPromotions() {
  const res = await api.get('/promotions');
  return res.data.data as Promotion[];
}

export async function createPromotion(input: { targetType: PromotionTargetType; targetId: string; budget: number; startsAt?: string; endsAt?: string }) {
  const res = await api.post('/promotions', input);
  return res.data.data as Promotion;
}

export async function updatePromotionStatus(id: string, status: PromotionStatus) {
  const res = await api.patch(`/promotions/${id}/status`, { status });
  return res.data.data as Promotion;
}

export async function trackImpression(id: string) {
  await api.post(`/promotions/${id}/impression`);
}

export async function trackClick(id: string) {
  await api.post(`/promotions/${id}/click`);
}
