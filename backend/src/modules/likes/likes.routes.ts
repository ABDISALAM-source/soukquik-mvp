import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { likesController } from './likes.controller';

const router = Router();

router.get('/count', asyncHandler(likesController.count));
router.get('/mine', authGuard, asyncHandler(likesController.mine));
router.post('/toggle', authGuard, asyncHandler(likesController.toggle));

export default router;
