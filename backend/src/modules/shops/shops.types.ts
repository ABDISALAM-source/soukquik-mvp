import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
});
export type CreateShopInput = z.infer<typeof createShopSchema>;

export const updateShopSchema = createShopSchema.partial();
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
