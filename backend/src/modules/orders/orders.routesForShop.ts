import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { ordersController } from './orders.controller';

const router = Router({ mergeParams: true });
router.get('/', authGuard, requireRole(['vendor']), asyncHandler(ordersController.listByShop));

export default router;
