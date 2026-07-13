import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { availabilityController } from './availability.controller';

const router = Router();

router.use(authGuard, requireRole(['provider']));
router.get('/mine', asyncHandler(availabilityController.listMine));
router.post('/rules', asyncHandler(availabilityController.createRule));
router.delete('/rules/:id', asyncHandler(availabilityController.deleteRule));
router.post('/exceptions', asyncHandler(availabilityController.createException));
router.delete('/exceptions/:id', asyncHandler(availabilityController.deleteException));

export default router;
