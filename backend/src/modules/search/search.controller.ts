import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { searchService } from './search.service';

export const searchController = {
  async search(req: Request, res: Response) {
    const { q, type, category, sort } = req.query;
    const data = await searchService.search({
      q: q as string,
      type: type as any,
      category: category as string,
      sort: sort as any,
    });
    return ok(res, data);
  },
};
