import { Request, Response } from 'express';
import { z } from 'zod';
import { ok } from '../../common/response';
import { brandsService } from './brands.service';

const createSchema = z.object({ name: z.string().min(1).max(80) });

export const brandsController = {
  async search(req: Request, res: Response) {
    const rows = await brandsService.search((req.query.q as string) ?? '');
    return ok(res, rows);
  },

  async create(req: Request, res: Response) {
    const { name } = createSchema.parse(req.body);
    const brand = await brandsService.findOrCreate(name);
    return ok(res, brand, 201);
  },
};
