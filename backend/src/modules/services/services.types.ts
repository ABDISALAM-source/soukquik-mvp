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
  // Infos pro (Phase 11)
  logoUrl: z.string().optional(),
  patente: z.string().optional(),
  slogan: z.string().optional(),
  idDocumentUrl: z.string().optional(),
});
export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(200).optional().default(10),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
