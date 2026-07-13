import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { servicesController } from './services.controller';
import bookingsRoutesForService from '../bookings/bookings.routesForService';

const router = Router();

router.get('/', asyncHandler(servicesController.list));
router.get('/analytics/mine', authGuard, requireRole(['provider']), asyncHandler(servicesController.analyticsMine));
router.get('/:id', asyncHandler(servicesController.getById));
router.post('/', authGuard, requireRole(['provider']), asyncHandler(servicesController.create));
router.patch('/:id', authGuard, requireRole(['provider']), asyncHandler(servicesController.update));
router.delete('/:id', authGuard, requireRole(['provider']), asyncHandler(servicesController.remove));

router.use('/:serviceId/bookings', bookingsRoutesForService);

export default router;
