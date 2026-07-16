import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { categoriesRepository } from './categories.repository';

export const categoriesController = {
  async list(req: Request, res: Response) {
    // ?parentId=X -> sous-catégories ; ?roots=true -> racines seules ;
    // sans param -> toutes (rétrocompat avec les tuiles de l'accueil).
    const { parentId, roots } = req.query;
    if (parentId) return ok(res, await categoriesRepository.findByParent(parentId as string));
    if (roots === 'true') return ok(res, await categoriesRepository.findRoots());
    return ok(res, await categoriesRepository.findAll());
  },
};
