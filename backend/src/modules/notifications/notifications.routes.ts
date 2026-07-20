import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { notificationsController } from './notifications.controller';

const router = Router();

router.use(authGuard);
router.get('/', asyncHandler(notificationsController.list));
router.get('/unread-count', asyncHandler(notificationsController.unreadCount));
router.patch('/read-all', asyncHandler(notificationsController.markAllRead));
router.patch('/:id/read', asyncHandler(notificationsController.markRead));

export default router;
