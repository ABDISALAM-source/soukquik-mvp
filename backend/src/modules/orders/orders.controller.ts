import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { ordersService } from './orders.service';
import { createOrderSchema, updateOrderStatusSchema } from './orders.types';

export const ordersController = {
  async create(req: Request, res: Response) {
    const input = createOrderSchema.parse(req.body);
    const order = await ordersService.create(req.user!.id, input);
    return ok(res, order, 201);
  },

  async listMine(req: Request, res: Response) {
    const rows = await ordersService.listMine(req.user!.id);
    return ok(res, rows);
  },

  async listByShop(req: Request, res: Response) {
    const rows = await ordersService.listByShop(req.params.shopId, req.user!.id);
    return ok(res, rows);
  },

  async updateStatus(req: Request, res: Response) {
    const input = updateOrderStatusSchema.parse(req.body);
    const order = await ordersService.updateStatus(req.params.id, req.user!.id, input.status);
    return ok(res, order);
  },
};
