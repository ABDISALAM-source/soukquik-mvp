import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ok } from '../../common/response';
import { env } from '../../config/env';
import { analyticsRepository } from './analytics.repository';

// Tracking ouvert au public (client non connecté inclus). On tente quand même
// de lire l'utilisateur depuis un éventuel Bearer token pour dédupliquer ses
// vues, sans l'exiger.
function optionalUserId(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), env.jwtAccessSecret) as { id: string };
    return payload.id;
  } catch {
    return null;
  }
}

export const analyticsController = {
  async trackProductView(req: Request, res: Response) {
    await analyticsRepository.recordProductView(req.params.id, optionalUserId(req));
    return ok(res, { tracked: true });
  },
  async trackShopVisit(req: Request, res: Response) {
    await analyticsRepository.recordShopVisit(req.params.id, optionalUserId(req));
    return ok(res, { tracked: true });
  },
  async trackServiceVisit(req: Request, res: Response) {
    await analyticsRepository.recordServiceVisit(req.params.id, optionalUserId(req));
    return ok(res, { tracked: true });
  },
};
