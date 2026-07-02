import { Request, Response } from 'express';
import { z } from 'zod';
import { ok } from '../../common/response';
import { Errors } from '../../common/errors';
import { chatRepository } from './chat.repository';

const messageSchema = z.object({ content: z.string().min(1) });

export const chatController = {
  async myChats(req: Request, res: Response) {
    const rows = await chatRepository.findMyChats(req.user!.id);
    return ok(res, rows);
  },

  async sendMessage(req: Request, res: Response) {
    const { content } = messageSchema.parse(req.body);
    const chat = await chatRepository.findById(req.params.id);
    if (!chat) throw Errors.notFound('Conversation introuvable');
    const message = await chatRepository.addMessage(chat.id, req.user!.id, content);
    return ok(res, message, 201);
  },

  async listMessages(req: Request, res: Response) {
    const chat = await chatRepository.findById(req.params.id);
    if (!chat) throw Errors.notFound('Conversation introuvable');
    const rows = await chatRepository.findMessages(chat.id);
    return ok(res, rows);
  },
};
