import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { Errors } from '../../common/errors';
import { authRepository } from './auth.repository';
import { GoogleLoginInput, LoginInput, PublicUser, RegisterInput } from './auth.types';

function toPublicUser(row: any): PublicUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
  };
}

function signTokens(user: { id: string; role: string }) {
  const accessToken = jwt.sign({ id: user.id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ id: user.id, role: user.role }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const exists = await authRepository.emailOrPhoneExists(input.email, input.phone);
    if (exists) throw Errors.conflict('Email ou téléphone déjà utilisé');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await authRepository.createUser({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role,
      avatarUrl: input.avatarUrl ?? null,
    });

    const tokens = signTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findByEmail(input.email);
    if (!user) throw Errors.unauthorized('Identifiants invalides');

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw Errors.unauthorized('Identifiants invalides');

    const tokens = signTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload: { id: string; role: string };
    try {
      payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as any;
    } catch {
      throw Errors.unauthorized('Refresh token invalide ou expiré');
    }
    const user = await authRepository.findById(payload.id);
    if (!user) throw Errors.unauthorized('Utilisateur introuvable');

    const accessToken = jwt.sign({ id: user.id, role: user.role }, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpires,
    } as jwt.SignOptions);
    return { accessToken };
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw Errors.notFound('Utilisateur introuvable');
    return toPublicUser(user);
  },

  async loginWithGoogle(input: GoogleLoginInput) {
    // Vérification serveur : on présente le token à l'API userinfo de
    // Google. Un token forgé/expiré est rejeté par Google, pas par nous —
    // aucun secret Google requis pour cet appel.
    let profile: { email?: string; email_verified?: boolean; name?: string; picture?: string };
    try {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${input.accessToken}` },
      });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      profile = (await resp.json()) as typeof profile;
    } catch {
      throw Errors.unauthorized('Token Google invalide ou expiré');
    }
    if (!profile.email) throw Errors.unauthorized('Le compte Google ne fournit pas d\'email');
    if (profile.email_verified === false) throw Errors.unauthorized('Email Google non vérifié');

    let user = await authRepository.findByEmail(profile.email);
    if (!user) {
      // Compte OAuth-only : mot de passe aléatoire irrécupérable (la
      // colonne est NOT NULL), connexion par mot de passe impossible tant
      // qu'aucun flux "définir un mot de passe" n'existe.
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await authRepository.createUser({
        fullName: profile.name || profile.email.split('@')[0],
        email: profile.email,
        phone: null,
        passwordHash,
        role: input.role ?? 'client',
        avatarUrl: profile.picture ?? null,
      });
    }

    const tokens = signTokens(user);
    return { user: toPublicUser(user), ...tokens };
  },
};
