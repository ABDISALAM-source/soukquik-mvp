import { create } from 'zustand';

export type Role = 'client' | 'vendor' | 'provider' | 'admin';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: SessionUser, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
}));
