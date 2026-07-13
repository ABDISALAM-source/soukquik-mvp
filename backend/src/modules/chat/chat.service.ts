import { Errors } from '../../common/errors';
import { shopsRepository } from '../shops/shops.repository';
import { servicesRepository } from '../services/services.repository';
import { chatRepository } from './chat.repository';

// Une conversation a deux côtés : le client (chat.client_id) et le
// propriétaire de la cible (boutique ou service). findRawById/findById
// renvoient tous deux la ligne brute (snake_case) sur ces deux repos.
async function assertParticipant(chat: any, userId: string) {
  if (chat.client_id === userId) return;

  if (chat.target_type === 'shop') {
    const shop = await shopsRepository.findRawById(chat.target_id);
    if (shop && shop.owner_id === userId) return;
  } else if (chat.target_type === 'service') {
    const service = await servicesRepository.findById(chat.target_id);
    if (service && service.provider_id === userId) return;
  }

  throw Errors.forbidden("Vous ne faites pas partie de cette conversation");
}

export const chatService = {
  myChats(userId: string) {
    return chatRepository.findMyChats(userId);
  },

  async sendMessage(chatId: string, userId: string, content: string) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw Errors.notFound('Conversation introuvable');
    await assertParticipant(chat, userId);
    return chatRepository.addMessage(chat.id, userId, content);
  },

  async listMessages(chatId: string, userId: string) {
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw Errors.notFound('Conversation introuvable');
    await assertParticipant(chat, userId);
    return chatRepository.findMessages(chat.id);
  },
};
