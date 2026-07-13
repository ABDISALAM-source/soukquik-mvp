import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { promotionsController } from './promotions.controller';

const router = Router();

router.get('/active', asyncHandler(promotionsController.listActive));
router.get('/mine', authGuard, requireRole(['vendor', 'provider']), asyncHandler(promotionsController.listMine));
router.get('/', authGuard, requireRole(['admin']), asyncHandler(promotionsController.listAll));
router.post('/', authGuard, requireRole(['vendor', 'provider']), asyncHandler(promotionsController.create));
router.patch('/:id/status', authGuard, requireRole(['admin']), asyncHandler(promotionsController.updateStatus));
router.post('/:id/impression', asyncHandler(promotionsController.trackImpression));
router.post('/:id/click', asyncHandler(promotionsController.trackClick));

export default router;
