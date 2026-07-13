import { z } from 'zod';

export const createPromotionSchema = z.object({
  targetType: z.enum(['shop', 'service', 'product']),
  targetId: z.string().uuid(),
  budget: z.number().positive(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'expired']),
});
