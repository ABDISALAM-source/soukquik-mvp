import { api } from './client';

type TargetType = 'shop' | 'service' | 'product';

export interface Review {
  id: string;
  authorId: string;
  authorName: string;
  targetType: TargetType;
  targetId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function fetchReviews(targetType: TargetType, targetId: string) {
  const res = await api.get('/reviews', { params: { targetType, targetId } });
  return res.data.data as { reviews: Review[]; summary: { count: number; average: number } };
}

export async function createReview(input: { targetType: TargetType; targetId: string; rating: number; comment?: string }) {
  const res = await api.post('/reviews', input);
  return res.data.data as Review;
}

export async function deleteReview(id: string) {
  await api.delete(`/reviews/${id}`);
}
