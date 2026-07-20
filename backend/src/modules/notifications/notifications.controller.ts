import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { notificationsService } from './notifications.service';

export const notificationsController = {
  async list(req: Request, res: Response) {
    const rows = await notificationsService.list(req.user!.id);
    return ok(res, rows);
  },

  async unreadCount(req: Request, res: Response) {
    const data = await notificationsService.unreadCount(req.user!.id);
    return ok(res, data);
  },

  async markRead(req: Request, res: Response) {
    const notification = await notificationsService.markRead(req.params.id, req.user!.id);
    return ok(res, notification);
  },

  async markAllRead(req: Request, res: Response) {
    await notificationsService.markAllRead(req.user!.id);
    return ok(res, { updated: true });
  },
};
