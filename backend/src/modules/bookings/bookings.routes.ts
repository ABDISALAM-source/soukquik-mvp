import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { bookingsController } from './bookings.controller';

const router = Router();

router.post('/', authGuard, requireRole(['client']), asyncHandler(bookingsController.create));
router.get('/me', authGuard, requireRole(['client']), asyncHandler(bookingsController.listMine));
router.patch('/:id/status', authGuard, requireRole(['provider']), asyncHandler(bookingsController.updateStatus));

export default router;
