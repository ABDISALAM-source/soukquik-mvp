import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { ordersController } from './orders.controller';

const router = Router();

router.post('/', authGuard, requireRole(['client']), asyncHandler(ordersController.create));
router.get('/me', authGuard, requireRole(['client']), asyncHandler(ordersController.listMine));
router.patch('/:id/status', authGuard, requireRole(['vendor']), asyncHandler(ordersController.updateStatus));

export default router;
