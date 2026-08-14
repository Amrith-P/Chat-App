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
        `SELECT m.id, m.conversationId, m.senderId, m.content AS text, m.messageType, m.replyToId, m.isForwarded, m.isEdited, m.isDeleted, m.readAt, m.createdAt, u.fullName AS senderName 
         FROM messages m
         JOIN users u ON m.senderId = u.id
         WHERE m.conversationId = ?
         ORDER BY m.createdAt ASC`,
        [chatId],
        (mErr, messages) => {
          if (mErr) {
            return res.status(500).json({ message: 'Error loading message history' });
          }

          // Fetch all reactions for this conversation
          db.all(
            `SELECT r.id, r.messageId, r.userId, r.emoji, u.fullName AS userName
             FROM message_reactions r
             JOIN messages m ON r.messageId = m.id
             JOIN users u ON r.userId = u.id
             WHERE m.conversationId = ?`,
            [chatId],
            (rErr, reactionsRows) => {
              const reactionsMap = {};
              if (!rErr && reactionsRows) {
                reactionsRows.forEach(r => {
                  if (!reactionsMap[r.messageId]) reactionsMap[r.messageId] = [];
                  reactionsMap[r.messageId].push({ id: r.id, userId: r.userId, userName: r.userName, emoji: r.emoji });
                });
              }

              const formattedMessages = messages.map((m) => {
                let text = m.isDeleted ? '🚫 This message was deleted' : m.text;
                return {
                  id: m.id,
                  chatId: m.conversationId,
                  senderId: m.senderId,
                  senderName: m.senderName,
                  isMe: m.senderId === currentUserId,
                  text: text,
                  messageType: m.messageType,
                  replyToId: m.replyToId,
                  isForwarded: Boolean(m.isForwarded),
                  isEdited: Boolean(m.isEdited),
                  isDeleted: Boolean(m.isDeleted),
                  readAt: m.readAt,
                  createdAt: m.createdAt,
                  time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  reactions: reactionsMap[m.id] || []
                };
              });

              res.json({ messages: formattedMessages });
            }
          );
        }
      );
    }
  );
};

// @desc    Send a message (REST fallback)
// @route   POST /api/messages
export const sendMessage = (req, res) => {
  const { chatId, content, messageType = 'text', replyToId = null, isForwarded = false } = req.body;
  const senderId = req.user.id;

  if (!chatId || !content || !content.trim()) {
    return res.status(400).json({ message: 'Chat ID and message content are required' });
  }

  db.run(
    'INSERT INTO messages (conversationId, senderId, content, messageType, replyToId, isForwarded) VALUES (?, ?, ?, ?, ?, ?)',
    [chatId, senderId, content.trim(), messageType, replyToId, isForwarded ? 1 : 0],
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
        replyToId,
        isForwarded,
        isEdited: false,
        isDeleted: false,
        readAt: null,
        reactions: [],
        createdAt: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      res.status(201).json({ message: newMessage });
    }
  );
};
