import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors';

export function errorFilter(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, data: null, error: err.message });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ success: false, data: null, error: 'Erreur serveur interne' });
}
