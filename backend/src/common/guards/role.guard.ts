import { NextFunction, Request, Response } from 'express';
import { Errors } from '../errors';
import { AuthUser } from './auth.guard';

export function requireRole(roles: AuthUser['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(Errors.forbidden('Rôle insuffisant pour cette action'));
    }
    return next();
  };
}
