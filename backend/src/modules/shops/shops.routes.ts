import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { shopsController } from './shops.controller';
import productsRoutesForShop from '../products/products.routesForShop';
import ordersRoutesForShop from '../orders/orders.routesForShop';

const router = Router();

router.get('/', asyncHandler(shopsController.list));
router.get('/:id', asyncHandler(shopsController.getById));
router.post('/', authGuard, requireRole(['vendor']), asyncHandler(shopsController.create));
router.patch('/:id', authGuard, requireRole(['vendor']), asyncHandler(shopsController.update));
router.delete('/:id', authGuard, requireRole(['vendor']), asyncHandler(shopsController.remove));
router.get('/:id/analytics', authGuard, requireRole(['vendor']), asyncHandler(shopsController.analytics));

// sous-ressources
router.use('/:shopId/products', productsRoutesForShop);
router.use('/:shopId/orders', ordersRoutesForShop);

export default router;
