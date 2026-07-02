import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { productsService } from './products.service';
import { createProductSchema, updateProductSchema } from './products.types';

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
};
