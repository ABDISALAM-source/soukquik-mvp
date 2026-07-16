import { z } from 'zod';

export const createShopSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(), // data-URI accepté (pas .url())
  // Infos pro (Phase 11)
  patente: z.string().optional(),
  slogan: z.string().optional(),
  idDocumentUrl: z.string().optional(),
});
export type CreateShopInput = z.infer<typeof createShopSchema>;

export const updateShopSchema = createShopSchema.partial().extend({
  // Bascule ouvert/fermé depuis le dashboard vendeur (Phase 10).
  isOpen: z.boolean().optional(),
});
export type UpdateShopInput = z.infer<typeof updateShopSchema>;

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().max(200).optional().default(10),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
