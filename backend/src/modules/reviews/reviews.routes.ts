import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { reviewsController } from './reviews.controller';

const router = Router();

router.get('/', asyncHandler(reviewsController.listByTarget));
router.post('/', authGuard, asyncHandler(reviewsController.create));
router.delete('/:id', authGuard, asyncHandler(reviewsController.remove));

export default router;
