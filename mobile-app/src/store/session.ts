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
  justRegistered: boolean;
  setSession: (user: SessionUser, accessToken: string, refreshToken: string, justRegistered?: boolean) => void;
  consumeJustRegistered: () => void;
  clearSession: () => void;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  justRegistered: false,
  setSession: (user, accessToken, refreshToken, justRegistered = false) =>
    set({ user, accessToken, refreshToken, justRegistered }),
  consumeJustRegistered: () => set({ justRegistered: false }),
  clearSession: () => set({ user: null, accessToken: null, refreshToken: null, justRegistered: false }),
}));
