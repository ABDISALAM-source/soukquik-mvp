import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { categoriesRepository } from './categories.repository';

export const categoriesController = {
  async list(_req: Request, res: Response) {
    const rows = await categoriesRepository.findAll();
    return ok(
      res,
      rows.map((r) => ({ id: r.id, name: r.name, type: r.type, icon: r.icon }))
    );
  },
};
