import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  role: z.enum(['client', 'vendor', 'provider']),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
}
