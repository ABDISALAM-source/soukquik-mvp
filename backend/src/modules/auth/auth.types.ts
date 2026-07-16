import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  role: z.enum(['client', 'vendor', 'provider']),
  // Photo de profil optionnelle (data-URI base64) — surtout utile aux
  // vendeurs/prestataires, facultative pour les clients.
  avatarUrl: z.string().optional(),
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

export const googleLoginSchema = z.object({
  // Access token OAuth renvoyé par Google côté mobile (expo-auth-session),
  // vérifié serveur en appelant l'API userinfo de Google — on ne fait
  // jamais confiance au client pour l'identité.
  accessToken: z.string().min(10),
  // Rôle appliqué uniquement à la création du compte (premier login Google) ;
  // ignoré si l'email existe déjà.
  role: z.enum(['client', 'vendor', 'provider']).optional(),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string | null;
}
