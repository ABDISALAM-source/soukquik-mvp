import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { Errors } from '../errors';

export interface AuthUser {
  id: string;
  role: 'client' | 'vendor' | 'provider' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(Errors.unauthorized('Token manquant'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as AuthUser;
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch {
    return next(Errors.unauthorized('Token invalide ou expiré'));
  }
}
