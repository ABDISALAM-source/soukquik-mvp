import { pool } from '../../config/db';

export const chatRepository = {
  async findOrCreateChat(clientId: string, targetType: 'shop' | 'service', targetId: string) {
    const { rows: existing } = await pool.query(
      'SELECT * FROM chats WHERE client_id = $1 AND target_type = $2 AND target_id = $3',
      [clientId, targetType, targetId]
    );
    if (existing[0]) return existing[0];

    const { rows } = await pool.query(
      'INSERT INTO chats (client_id, target_type, target_id) VALUES ($1,$2,$3) RETURNING *',
      [clientId, targetType, targetId]
    );
    return rows[0];
  },

  async findMyChats(clientId: string) {
    const { rows } = await pool.query('SELECT * FROM chats WHERE client_id = $1 ORDER BY created_at DESC', [clientId]);
    return rows;
  },

  async findById(id: string) {
    const { rows } = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async addMessage(chatId: string, senderId: string, content: string) {
    const { rows } = await pool.query(
      'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1,$2,$3) RETURNING *',
      [chatId, senderId, content]
    );
    return rows[0];
  },

  async findMessages(chatId: string) {
    const { rows } = await pool.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at ASC', [chatId]);
    return rows;
  },
};
