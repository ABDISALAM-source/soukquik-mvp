import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

export function errorFilter(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, data: null, error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, data: null, error: 'Requête invalide' });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ success: false, data: null, error: 'Erreur serveur interne' });
}
