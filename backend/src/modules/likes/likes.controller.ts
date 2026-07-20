import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { likesService } from './likes.service';
import { targetSchema, mineListQuerySchema } from './likes.types';

export const likesController = {
  async toggle(req: Request, res: Response) {
    const input = targetSchema.parse(req.body);
    const result = await likesService.toggle(req.user!.id, input);
    return ok(res, result);
  },

  async count(req: Request, res: Response) {
    const input = targetSchema.parse({ targetType: req.query.targetType, targetId: req.query.targetId });
    const result = await likesService.count(input);
    return ok(res, result);
  },

  async mine(req: Request, res: Response) {
    const input = targetSchema.parse({ targetType: req.query.targetType, targetId: req.query.targetId });
    const result = await likesService.mine(req.user!.id, input);
    return ok(res, result);
  },

  async mineList(req: Request, res: Response) {
    const { targetType } = mineListQuerySchema.parse({ targetType: req.query.targetType });
    const result = await likesService.mineList(req.user!.id, targetType);
    return ok(res, result);
  },
};
