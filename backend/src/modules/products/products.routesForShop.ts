import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { productsController } from './products.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(productsController.listByShop));
router.post('/', authGuard, requireRole(['vendor']), asyncHandler(productsController.create));

export default router;
