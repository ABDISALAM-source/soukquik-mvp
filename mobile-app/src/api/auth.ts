import { api } from './client';

export async function register(input: { fullName: string; email: string; phone: string; password: string; role: string; avatarUrl?: string }) {
  const res = await api.post('/auth/register', input);
  return res.data.data as { user: any; accessToken: string; refreshToken: string };
}

export async function login(input: { email: string; password: string }) {
  const res = await api.post('/auth/login', input);
  return res.data.data as { user: any; accessToken: string; refreshToken: string };
}

export async function loginWithGoogle(input: { accessToken: string; role?: string }) {
  const res = await api.post('/auth/google', input);
  return res.data.data as { user: any; accessToken: string; refreshToken: string };
}
