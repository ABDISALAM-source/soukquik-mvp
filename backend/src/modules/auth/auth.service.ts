import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { Errors } from '../../common/errors';
import { authRepository } from './auth.repository';
import { LoginInput, PublicUser, RegisterInput } from './auth.types';

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
};
