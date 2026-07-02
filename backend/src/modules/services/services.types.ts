import { z } from 'zod';

export const createServiceSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive(),
  priceUnit: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  serviceAreaKm: z.number().positive().optional(),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
