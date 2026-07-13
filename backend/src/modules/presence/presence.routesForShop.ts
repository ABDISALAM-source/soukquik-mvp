import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { presenceController } from './presence.controller';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(presenceController.count));
router.post('/enter', authGuard, asyncHandler(presenceController.enter));
router.post('/leave', authGuard, asyncHandler(presenceController.leave));

export default router;
