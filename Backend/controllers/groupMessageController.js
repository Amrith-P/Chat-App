import db from '../config/db.js';

// @desc    Get paginated messages for a group conversation
// @route   GET /api/groups/:groupId/messages
export const getGroupMessages = (req, res) => {
  const groupId = req.params.groupId;
  const currentUserId = req.user.id;
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '50', 10);
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      m.id,
      m.conversationId,
      m.senderId,
      m.content,
      m.messageType,
      m.replyToId,
      m.isForwarded,
      m.isEdited,
      m.isDeleted,
      m.readAt,
      m.createdAt,
      u.fullName AS senderName,
      u.avatar AS senderAvatar
    FROM messages m
    JOIN users u ON m.senderId = u.id
    WHERE m.conversationId = ?
      AND m.id NOT IN (SELECT messageId FROM deleted_messages_for_user WHERE userId = ?)
    ORDER BY m.id ASC
    LIMIT ? OFFSET ?
  `;

  db.all(query, [groupId, currentUserId, limit, offset], (err, messages) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to fetch group messages', error: err.message });
    }

    const formattedMessages = (messages || []).map((msg) => {
      const isMe = String(msg.senderId) === String(currentUserId);
      const isDeletedGlobally = Boolean(msg.isDeleted);

      return {
        id: msg.id,
        chatId: msg.conversationId,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        isMe,
        text: isDeletedGlobally ? '🚫 This message was deleted' : msg.content,
        content: isDeletedGlobally ? '🚫 This message was deleted' : msg.content,
        replyToId: msg.replyToId,
        isForwarded: Boolean(msg.isForwarded),
        isEdited: Boolean(msg.isEdited),
        isDeleted: isDeletedGlobally,
        readAt: msg.readAt,
        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(msg.createdAt).toLocaleDateString()
      };
    });

    res.json({
      messages: formattedMessages,
      page,
      limit,
      hasMore: formattedMessages.length === limit
    });
  });
};

// @desc    Send message to a group
// @route   POST /api/groups/:groupId/messages
export const sendGroupMessage = (req, res) => {
  const groupId = req.params.groupId;
  const senderId = req.user.id;
  const { content, text, replyToId = null, isForwarded = false } = req.body;
  const messageContent = (content || text || '').trim();

  if (!messageContent) {
    return res.status(400).json({ message: 'Message content cannot be empty' });
  }

  const query = `
    INSERT INTO messages (conversationId, senderId, content, replyToId, isForwarded)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [groupId, senderId, messageContent, replyToId, isForwarded ? 1 : 0], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Failed to save group message', error: err.message });
    }

    const newMsgId = this.lastID;

    db.get('SELECT fullName, avatar FROM users WHERE id = ?', [senderId], (uErr, sender) => {
      const createdMessage = {
        id: newMsgId,
        chatId: Number(groupId),
        conversationId: Number(groupId),
        senderId,
        senderName: sender ? sender.fullName : req.user.fullName,
        senderAvatar: sender ? sender.avatar : req.user.avatar,
        isMe: true,
        text: messageContent,
        content: messageContent,
        replyToId,
        isForwarded: Boolean(isForwarded),
        isEdited: false,
        isDeleted: false,
        readAt: null,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString()
      };

      res.status(201).json({
        success: true,
        message: createdMessage
      });
    });
  });
};
