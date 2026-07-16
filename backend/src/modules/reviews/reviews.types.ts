import { z } from 'zod';

export const createReviewSchema = z.object({
  targetType: z.enum(['shop', 'service', 'product']),
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  // Notes détaillées optionnelles (Phase 10) : plus utiles pour comparer.
  ratingQuality: z.number().int().min(1).max(5).optional(),
  ratingValue: z.number().int().min(1).max(5).optional(),
  ratingPunctuality: z.number().int().min(1).max(5).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const targetQuerySchema = z.object({
  targetType: z.enum(['shop', 'service', 'product']),
  targetId: z.string().uuid(),
});
