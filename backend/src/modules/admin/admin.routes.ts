import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { adminController } from './admin.controller';

const router = Router();
router.use(authGuard, requireRole(['admin']));
router.get('/users', asyncHandler(adminController.listUsers));
router.patch('/users/:id/status', asyncHandler(adminController.updateUserStatus));
router.get('/stats', asyncHandler(adminController.stats));

export default router;
