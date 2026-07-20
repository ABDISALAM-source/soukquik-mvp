import { Request, Response } from 'express';
import { z } from 'zod';
import { ok } from '../../common/response';
import { chatService } from './chat.service';

const messageSchema = z.object({ content: z.string().min(1) });

export const chatController = {
  async myChats(req: Request, res: Response) {
    const rows = await chatService.myChats(req.user!.id);
    return ok(res, rows);
  },

  async sendMessage(req: Request, res: Response) {
    const { content } = messageSchema.parse(req.body);
    const message = await chatService.sendMessage(req.params.id, req.user!.id, content);
    return ok(res, message, 201);
  },

  async listMessages(req: Request, res: Response) {
    const rows = await chatService.listMessages(req.params.id, req.user!.id);
    return ok(res, rows);
  },
};
