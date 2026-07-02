import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
