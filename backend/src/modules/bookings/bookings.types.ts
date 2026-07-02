import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'completed', 'cancelled']),
});
