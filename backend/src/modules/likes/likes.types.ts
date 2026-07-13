import { z } from 'zod';

export const targetSchema = z.object({
  targetType: z.enum(['shop', 'service', 'product']),
  targetId: z.string().uuid(),
});
export type TargetInput = z.infer<typeof targetSchema>;
