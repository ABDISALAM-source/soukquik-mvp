import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { promotionsService } from './promotions.service';
import { createPromotionSchema, updateStatusSchema } from './promotions.types';

export const promotionsController = {
  async create(req: Request, res: Response) {
    const input = createPromotionSchema.parse(req.body);
    const promotion = await promotionsService.create(req.user!.id, input);
    return ok(res, promotion, 201);
  },

  async listMine(req: Request, res: Response) {
    const rows = await promotionsService.listMine(req.user!.id);
    return ok(res, rows);
  },

  async listActive(req: Request, res: Response) {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const rows = await promotionsService.listActive(limit);
    return ok(res, rows);
  },

  async listAll(_req: Request, res: Response) {
    const rows = await promotionsService.listAll();
    return ok(res, rows);
  },

  async updateStatus(req: Request, res: Response) {
    const input = updateStatusSchema.parse(req.body);
    const promotion = await promotionsService.updateStatus(req.params.id, input.status);
    return ok(res, promotion);
  },

  async trackImpression(req: Request, res: Response) {
    await promotionsService.trackImpression(req.params.id);
    return ok(res, { tracked: true });
  },

  async trackClick(req: Request, res: Response) {
    await promotionsService.trackClick(req.params.id);
    return ok(res, { tracked: true });
  },
};
