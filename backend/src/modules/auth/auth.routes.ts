import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { authController } from './auth.controller';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.get('/me', authGuard, asyncHandler(authController.me));

export default router;
