import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { reviewsService } from './reviews.service';
import { createReviewSchema, targetQuerySchema } from './reviews.types';

export const reviewsController = {
  async create(req: Request, res: Response) {
    const input = createReviewSchema.parse(req.body);
    const review = await reviewsService.create(req.user!.id, input);
    return ok(res, review, 201);
  },

  async listByTarget(req: Request, res: Response) {
    const { targetType, targetId } = targetQuerySchema.parse({
      targetType: req.query.targetType,
      targetId: req.query.targetId,
    });
    const data = await reviewsService.listByTarget(targetType, targetId);
    return ok(res, data);
  },

  async remove(req: Request, res: Response) {
    await reviewsService.remove(req.params.id, req.user!.id);
    return ok(res, { deleted: true });
  },
};
