import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { chatController } from './chat.controller';

const router = Router();
router.use(authGuard);
router.get('/me', asyncHandler(chatController.myChats));
router.get('/:id/messages', asyncHandler(chatController.listMessages));
router.post('/:id/messages', asyncHandler(chatController.sendMessage));

export default router;
