import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { availabilityService } from './availability.service';
import { createRuleSchema, createExceptionSchema } from './availability.types';

export const availabilityController = {
  async listMine(req: Request, res: Response) {
    const data = await availabilityService.listMine(req.user!.id);
    return ok(res, data);
  },

  async createRule(req: Request, res: Response) {
    const input = createRuleSchema.parse(req.body);
    const rule = await availabilityService.createRule(req.user!.id, input);
    return ok(res, rule, 201);
  },

  async deleteRule(req: Request, res: Response) {
    await availabilityService.deleteRule(req.params.id, req.user!.id);
    return ok(res, { deleted: true });
  },

  async createException(req: Request, res: Response) {
    const input = createExceptionSchema.parse(req.body);
    const exception = await availabilityService.createException(req.user!.id, input);
    return ok(res, exception, 201);
  },

  async deleteException(req: Request, res: Response) {
    await availabilityService.deleteException(req.params.id, req.user!.id);
    return ok(res, { deleted: true });
  },
};
