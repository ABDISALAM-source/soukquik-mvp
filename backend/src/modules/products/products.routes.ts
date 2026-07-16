import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { productsController } from './products.controller';

const router = Router();

router.get('/price-hint', asyncHandler(productsController.priceHint));
router.get('/compare', asyncHandler(productsController.compare));
router.post('/image-search', asyncHandler(productsController.imageSearch));
router.get('/:id', asyncHandler(productsController.getById));
router.patch('/:id', authGuard, requireRole(['vendor']), asyncHandler(productsController.update));
router.delete('/:id', authGuard, requireRole(['vendor']), asyncHandler(productsController.remove));

export default router;
