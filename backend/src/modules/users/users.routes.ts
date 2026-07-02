import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { usersController } from './users.controller';

const router = Router();
router.get('/:id', authGuard, asyncHandler(usersController.getById));
router.patch('/me', authGuard, asyncHandler(usersController.updateMe));

export default router;
