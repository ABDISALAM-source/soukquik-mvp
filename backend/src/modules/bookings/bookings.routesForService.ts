import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { bookingsController } from './bookings.controller';

const router = Router({ mergeParams: true });
router.get('/', authGuard, requireRole(['provider']), asyncHandler(bookingsController.listByService));

export default router;
