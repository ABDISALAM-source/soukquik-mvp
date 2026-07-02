import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { servicesService } from './services.service';
import { createServiceSchema, updateServiceSchema } from './services.types';

export const servicesController = {
  async list(req: Request, res: Response) {
    const { category, q, sort } = req.query;
    const rows = await servicesService.list({ category: category as string, q: q as string, sort: sort as string });
    return ok(res, rows);
  },

  async getById(req: Request, res: Response) {
    const service = await servicesService.getById(req.params.id);
    return ok(res, service);
  },

  async create(req: Request, res: Response) {
    const input = createServiceSchema.parse(req.body);
    const service = await servicesService.create(req.user!.id, input);
    return ok(res, service, 201);
  },

  async update(req: Request, res: Response) {
    const input = updateServiceSchema.parse(req.body);
    const service = await servicesService.update(req.params.id, req.user!.id, input);
    return ok(res, service);
  },

  async remove(req: Request, res: Response) {
    await servicesService.remove(req.params.id, req.user!.id);
    return ok(res, { deleted: true });
  },
};
