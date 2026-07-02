import { z } from 'zod';

export const createOrderSchema = z.object({
  shopId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).min(1),
  deliveryAddress: z.string().optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'preparing', 'delivered', 'cancelled']),
});
