import { z } from 'zod';

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format attendu: HH:MM');

export const createRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
});
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

export const createExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu: YYYY-MM-DD'),
  isClosed: z.boolean(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
});
export type CreateExceptionInput = z.infer<typeof createExceptionSchema>;
