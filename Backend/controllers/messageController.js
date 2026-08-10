import db from '../config/db.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:chatId
export const getMessagesByChatId = (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user.id;

  // Verify user is a member of the conversation
  db.get(
    'SELECT * FROM conversation_members WHERE conversationId = ? AND userId = ?',
    [chatId, currentUserId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ message: 'Not authorized to view messages for this chat' });
      }

      db.all(
        `SELECT m.id, m.conversationId, m.senderId, m.content AS text, m.messageType, m.createdAt, u.fullName AS senderName 
         FROM messages m
         JOIN users u ON m.senderId = u.id
         WHERE m.conversationId = ?
         ORDER BY m.createdAt ASC`,
        [chatId],
        (mErr, messages) => {
          if (mErr) {
            return res.status(500).json({ message: 'Error loading message history' });
          }

          const formattedMessages = messages.map((m) => ({
            id: m.id,
            chatId: m.conversationId,
            senderId: m.senderId,
            senderName: m.senderName,
            isMe: m.senderId === currentUserId,
            text: m.text,
            messageType: m.messageType,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          res.json({ messages: formattedMessages });
        }
      );
    }
  );
};

// @desc    Send a message (REST fallback)
// @route   POST /api/messages
export const sendMessage = (req, res) => {
  const { chatId, content, messageType = 'text' } = req.body;
  const senderId = req.user.id;

  if (!chatId || !content || !content.trim()) {
    return res.status(400).json({ message: 'Chat ID and message content are required' });
  }

  db.run(
    'INSERT INTO messages (conversationId, senderId, content, messageType) VALUES (?, ?, ?, ?)',
    [chatId, senderId, content.trim(), messageType],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to send message', error: err.message });
      }

      const newMessage = {
        id: this.lastID,
        chatId,
        senderId,
        isMe: true,
        text: content.trim(),
        messageType,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      res.status(201).json({ message: newMessage });
    }
  );
};
