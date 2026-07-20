import { Request, Response } from 'express';
import { z } from 'zod';
import { ok } from '../../common/response';
import { productsService } from './products.service';
import { createProductSchema, updateProductSchema } from './products.types';

const imageSearchSchema = z.object({
  imageBase64: z.string().min(100), // image encodée base64 (sans préfixe data:)
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export const productsController = {
  async listByShop(req: Request, res: Response) {
    const rows = await productsService.listByShop(req.params.shopId);
    return ok(res, rows);
  },

  async create(req: Request, res: Response) {
    const input = createProductSchema.parse(req.body);
    const product = await productsService.create(req.params.shopId, req.user!.id, input);
    return ok(res, product, 201);
  },

  async update(req: Request, res: Response) {
    const input = updateProductSchema.parse(req.body);
    const product = await productsService.update(req.params.id, req.user!.id, input);
    return ok(res, product);
  },

  async remove(req: Request, res: Response) {
    await productsService.remove(req.params.id, req.user!.id);
    return ok(res, { deleted: true });
  },

  async getById(req: Request, res: Response) {
    const product = await productsService.getById(req.params.id);
    return ok(res, product);
  },

  async priceHint(req: Request, res: Response) {
    const categoryId = req.query.categoryId as string;
    if (!categoryId) return ok(res, { count: 0, min: null, median: null, max: null });
    const hint = await productsService.priceHint(categoryId);
    return ok(res, hint);
  },

  async compare(req: Request, res: Response) {
    const q = (req.query.q as string) ?? '';
    const lat = req.query.lat ? Number(req.query.lat) : null;
    const lng = req.query.lng ? Number(req.query.lng) : null;
    const sort = req.query.sort === 'distance' ? 'distance' : 'price';
    const rows = await productsService.compare(q, lat, lng, sort);
    return ok(res, rows);
  },

  async imageSearch(req: Request, res: Response) {
    const input = imageSearchSchema.parse(req.body);
    const data = await productsService.imageSearch(input.imageBase64, input.lat ?? null, input.lng ?? null);
    return ok(res, data);
  },
};
