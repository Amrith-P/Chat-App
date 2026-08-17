import db from '../config/db.js';
import { areUsersFriends } from '../middleware/friendshipMiddleware.js';

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
           AND m.id NOT IN (SELECT messageId FROM deleted_messages_for_user WHERE userId = ?)
         ORDER BY m.id ASC`,
        [chatId, currentUserId],
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
                const isGloballyDeleted = Boolean(m.isDeleted);
                let text = isGloballyDeleted ? '🚫 This message was deleted' : m.text;
                return {
                  id: m.id,
                  chatId: m.conversationId,
                  senderId: m.senderId,
                  senderName: m.senderName,
                  isMe: m.senderId === currentUserId,
                  text: text,
                  messageType: isGloballyDeleted ? 'text' : m.messageType,
                  replyToId: isGloballyDeleted ? null : m.replyToId,
                  isForwarded: isGloballyDeleted ? false : Boolean(m.isForwarded),
                  isEdited: isGloballyDeleted ? false : Boolean(m.isEdited),
                  isDeleted: isGloballyDeleted,
                  readAt: m.readAt,
                  createdAt: m.createdAt,
                  time: m.createdAt,
                  reactions: isGloballyDeleted ? [] : (reactionsMap[m.id] || [])
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

  // Verify conversation type and friendship if direct chat
  db.get('SELECT id, type FROM conversations WHERE id = ?', [targetChatId], (cErr, conv) => {
    if (cErr || !conv) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (conv.type === 'direct') {
      db.get('SELECT userId FROM conversation_members WHERE conversationId = ? AND userId != ?', [targetChatId, senderId], async (mErr, otherMember) => {
        if (otherMember) {
          const isFriends = await areUsersFriends(senderId, otherMember.userId);
          if (!isFriends) {
            return res.status(403).json({
              message: 'Forbidden: You must be friends to send messages in a private chat',
              code: 'FRIENDSHIP_REQUIRED'
            });
          }
        }
        executeSendMessage();
      });
    } else {
      executeSendMessage();
    }
  });

  const executeSendMessage = () => {
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

// @desc    Delete a message for everyone (Sender only)
// @route   DELETE /api/messages/:id/everyone
export const deleteMessageForEveryone = (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;

  if (!messageId) {
    return res.status(400).json({ message: 'Message ID is required' });
  }

  db.get('SELECT * FROM messages WHERE id = ?', [messageId], (err, msg) => {
    if (err || !msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const msgSenderId = msg.senderid || msg.senderId;

    if (String(msgSenderId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized: Only the sender can delete a message for everyone' });
    }

    db.run('UPDATE messages SET content = "", isDeleted = 1 WHERE id = ?', [messageId], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: 'Failed to delete message for everyone', error: updateErr.message });
      }

      db.run('DELETE FROM message_reactions WHERE messageid = ? OR messageId = ?', [messageId, messageId], () => {});

      const chatId = msg.conversationid || msg.conversationId;

      res.json({
        success: true,
        message: 'Message deleted for everyone',
        messageId,
        chatId
      });
    });
  });
};

// @desc    Delete a message for me (Current user only)
// @route   DELETE /api/messages/:id/me
export const deleteMessageForMe = (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;

  if (!messageId) {
    return res.status(400).json({ message: 'Message ID is required' });
  }

  db.get('SELECT * FROM messages WHERE id = ?', [messageId], (err, msg) => {
    if (err || !msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chatId = msg.conversationid || msg.conversationId;

    db.get('SELECT * FROM conversation_members WHERE conversationid = ? AND userid = ?', [chatId, userId], (mErr, member) => {
      if (mErr || !member) {
        return res.status(403).json({ message: 'Not authorized: You do not belong to this conversation' });
      }

      db.run(
        'INSERT INTO deleted_messages_for_user (messageId, userId) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [messageId, userId],
        (insErr) => {
          if (insErr && !insErr.message.includes('UNIQUE')) {
            return res.status(500).json({ message: 'Failed to delete message for user', error: insErr.message });
          }

          res.json({
            success: true,
            message: 'Message deleted for me',
            messageId,
            chatId
          });
        }
      );
    });
  });
};

// @desc    Delete a message legacy fallback
// @route   DELETE /api/messages/:id
export const deleteMessage = (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;

  if (!messageId) {
    return res.status(400).json({ message: 'Message ID is required' });
  }

  db.get('SELECT senderid, senderId FROM messages WHERE id = ?', [messageId], (err, msg) => {
    if (err || !msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const msgSenderId = msg.senderid || msg.senderId;

    if (String(msgSenderId) === String(userId)) {
      db.run('UPDATE messages SET content = "", isDeleted = 1 WHERE id = ?', [messageId], () => {
        return res.json({ success: true, message: 'Message deleted for everyone', messageId });
      });
    } else {
      db.run('INSERT INTO deleted_messages_for_user (messageId, userId) VALUES (?, ?) ON CONFLICT DO NOTHING', [messageId, userId], () => {
        return res.json({ success: true, message: 'Message deleted for me', messageId });
      });
    }
  });
};
