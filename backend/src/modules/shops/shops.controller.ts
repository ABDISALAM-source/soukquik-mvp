import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { shopsService } from './shops.service';
import { createShopSchema, updateShopSchema, nearbyQuerySchema } from './shops.types';

export const shopsController = {
  async list(req: Request, res: Response) {
    const { category, q } = req.query;
    const rows = await shopsService.list({ category: category as string, q: q as string });
    return ok(res, rows);
  },

  async nearby(req: Request, res: Response) {
    const { lat, lng, radiusKm, limit } = nearbyQuerySchema.parse(req.query);
    const rows = await shopsService.nearby(lat, lng, radiusKm, limit);
    return ok(res, rows);
  },

  async trending(req: Request, res: Response) {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 30) : 10;
    const rows = await shopsService.trending(limit);
    return ok(res, rows);
  },

  async popularProducts(req: Request, res: Response) {
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 20) : 8;
    const rows = await shopsService.popularProducts(req.params.id, limit);
    return ok(res, rows);
  },

  async getById(req: Request, res: Response) {
    const shop = await shopsService.getById(req.params.id);
    return ok(res, shop);
  },

  async create(req: Request, res: Response) {
    const input = createShopSchema.parse(req.body);
    const shop = await shopsService.create(req.user!.id, input);
    return ok(res, shop, 201);
  },

  async update(req: Request, res: Response) {
    const input = updateShopSchema.parse(req.body);
    const shop = await shopsService.update(req.params.id, req.user!.id, input);
    return ok(res, shop);
  },

  async remove(req: Request, res: Response) {
    await shopsService.remove(req.params.id, req.user!.id);
    return ok(res, { deleted: true });
  },

  async analytics(req: Request, res: Response) {
    const data = await shopsService.analytics(req.params.id, req.user!.id);
    return ok(res, data);
  },
};
