import { api } from './client';

type TargetType = 'shop' | 'service' | 'product';

export async function toggleLike(targetType: TargetType, targetId: string) {
  const res = await api.post('/likes/toggle', { targetType, targetId });
  return res.data.data as { liked: boolean; count: number };
}

export async function fetchLikeCount(targetType: TargetType, targetId: string) {
  const res = await api.get('/likes/count', { params: { targetType, targetId } });
  return res.data.data as { count: number };
}

export async function fetchMyLike(targetType: TargetType, targetId: string) {
  const res = await api.get('/likes/mine', { params: { targetType, targetId } });
  return res.data.data as { liked: boolean };
}

export interface LikedTarget {
  targetType: TargetType;
  targetId: string;
  createdAt: string;
}

export async function fetchMyLikes(targetType?: TargetType) {
  const res = await api.get('/likes/mine-list', { params: targetType ? { targetType } : undefined });
  return res.data.data as LikedTarget[];
}
