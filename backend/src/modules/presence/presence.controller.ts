import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { presenceService } from './presence.service';

export const presenceController = {
  async enter(req: Request, res: Response) {
    await presenceService.enter(req.params.shopId, req.user!.id);
    return ok(res, { entered: true });
  },

  async leave(req: Request, res: Response) {
    await presenceService.leave(req.params.shopId, req.user!.id);
    return ok(res, { left: true });
  },

  async count(req: Request, res: Response) {
    const data = await presenceService.count(req.params.shopId);
    return ok(res, data);
  },
};
