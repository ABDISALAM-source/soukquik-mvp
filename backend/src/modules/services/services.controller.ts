import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { Errors } from '../../common/errors';
import { availabilityService } from '../availability/availability.service';
import { servicesService } from './services.service';
import { createServiceSchema, updateServiceSchema, nearbyQuerySchema } from './services.types';

export const servicesController = {
  async list(req: Request, res: Response) {
    const { category, q, sort } = req.query;
    const rows = await servicesService.list({ category: category as string, q: q as string, sort: sort as string });
    return ok(res, rows);
  },

  async nearby(req: Request, res: Response) {
    const { lat, lng, radiusKm, limit } = nearbyQuerySchema.parse(req.query);
    const rows = await servicesService.nearby(lat, lng, radiusKm, limit);
    return ok(res, rows);
  },

  async trending(req: Request, res: Response) {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 30) : 10;
    const rows = await servicesService.trending(limit);
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

  async analyticsMine(req: Request, res: Response) {
    const data = await servicesService.analyticsMine(req.user!.id);
    return ok(res, data);
  },

  async availability(req: Request, res: Response) {
    const date = req.query.date as string;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Errors.badRequest('Paramètre date requis (YYYY-MM-DD)');
    const service = await servicesService.getById(req.params.id);
    const resolved = await availabilityService.resolveForDate(service.providerId, date);
    return ok(res, { date, ...resolved });
  },
};
