import db from '../config/db.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:chatId
export const getMessagesByChatId = (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user.id;

  // Verify user is a member of the conversation
  db.get(
    'SELECT * FROM conversation_members WHERE conversationid = ? AND userid = ?',
    [chatId, currentUserId],
    (err, member) => {
      if (err || !member) {
        return res.status(403).json({ message: 'Not authorized to view messages for this chat' });
      }

      db.all(
        `SELECT m.id AS "id", m.conversationid AS "conversationId", m.senderid AS "senderId", m.content AS "text", m.messagetype AS "messageType", m.replytoid AS "replyToId", m.isforwarded AS "isForwarded", m.isedited AS "isEdited", m.isdeleted AS "isDeleted", m.readat AS "readAt", m.createdat AS "createdAt", u.fullname AS "senderName" 
         FROM messages m
         JOIN users u ON m.senderid = u.id
         WHERE m.conversationid = ?
         ORDER BY m.id ASC`,
        [chatId],
        (mErr, messages) => {
          if (mErr) {
            return res.status(500).json({ message: 'Error loading message history' });
          }

          // Fetch all reactions for this conversation
          db.all(
            `SELECT r.id AS "id", r.messageid AS "messageId", r.userid AS "userId", r.emoji AS "emoji", u.fullname AS "userName"
             FROM message_reactions r
             JOIN messages m ON r.messageid = m.id
             JOIN users u ON r.userid = u.id
             WHERE m.conversationid = ?`,
            [chatId],
            (rErr, reactionsRows) => {
              const reactionsMap = {};
              if (!rErr && reactionsRows) {
                reactionsRows.forEach(r => {
                  const mId = r.messageId || r.messageid;
                  const uId = r.userId || r.userid;
                  const uName = r.userName || r.username;
                  if (!reactionsMap[mId]) reactionsMap[mId] = [];
                  reactionsMap[mId].push({ id: r.id, userId: uId, userName: uName, emoji: r.emoji });
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
                  time: m.createdAt,
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
  const { chatId, conversationId, content, messageType = 'text', replyToId = null, isForwarded = false } = req.body;
  const targetChatId = chatId || conversationId;
  const senderId = req.user.id;

  if (!targetChatId || !content || !content.trim()) {
    return res.status(400).json({ message: 'Chat ID and message content are required' });
  }

  db.run(
    'INSERT INTO messages (conversationid, senderid, content, messagetype, replytoid, isforwarded) VALUES (?, ?, ?, ?, ?, ?)',
    [targetChatId, senderId, content.trim(), messageType, replyToId, isForwarded ? 1 : 0],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to send message', error: err.message });
      }

      const newMessage = {
        id: this.lastID,
        chatId: targetChatId,
        conversationId: targetChatId,
        senderId,
        isMe: true,
        text: content.trim(),
        content: content.trim(),
        messageType,
        replyToId,
        isForwarded: Boolean(isForwarded),
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

// @desc    Clear messages by chatId
// @route   DELETE /api/messages/chat/:chatId
export const clearMessagesByChatId = (req, res) => {
  const chatId = req.params.chatId || req.params.id;

  if (!chatId) {
    return res.status(400).json({ message: 'Chat ID is required' });
  }

  db.run('DELETE FROM messages WHERE conversationid = ? OR conversationId = ?', [chatId, chatId], (err) => {
    if (err) {
      console.error('Failed to clear chat messages:', err.message);
      return res.status(500).json({ message: 'Failed to clear chat messages', error: err.message });
    }
    res.json({ success: true, message: 'Chat messages cleared successfully', chatId });
  });
};
