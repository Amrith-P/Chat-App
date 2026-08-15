import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Map of userId -> Set of active socket IDs
const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app') || origin === process.env.CLIENT_URL) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true
    }
  });

  // Socket Middleware: Validate JWT Token
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_chat_app_2026_xyz');
      socket.user = decoded; // { id, email, fullName }
      next();
    } catch (err) {
      return next(new Error('Authentication error: Token invalid'));
    }
  });

  io.on('connection', (socket) => {
    const userId = Number(socket.user.id);
    console.log(`⚡ User connected to WebSocket: ${socket.user.fullName} (ID: ${userId})`);

    // Track online user sockets
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct messaging
    socket.join(`user_${userId}`);

    // Send full list of currently online users to the newly connected socket
    socket.emit('online_users_list', { userIds: Array.from(onlineUsers.keys()) });

    // Broadcast online status to all other sockets
    io.emit('user_online', { userId });

    // Handle joining a specific chat room
    socket.on('join_chat', ({ chatId, conversationId }) => {
      const targetRoom = chatId || conversationId;
      if (targetRoom) {
        socket.join(`chat_${targetRoom}`);
      }
    });

    // Handle real-time sending of messages
    socket.on('send_message', (data = {}) => {
      const targetChatId = data.chatId || data.conversationId;
      const targetText = data.text || data.content;
      const recipientId = data.recipientId;
      const replyToId = data.replyToId || null;
      const isForwarded = data.isForwarded || false;

      if (!targetChatId || !targetText || !targetText.trim()) {
        console.warn('⚠️ Invalid send_message payload received:', data);
        return;
      }

      const trimmedText = targetText.trim();

      // Store in database (SQLite or PostgreSQL)
      db.run(
        'INSERT INTO messages (conversationId, senderId, content, replyToId, isForwarded) VALUES (?, ?, ?, ?, ?)',
        [targetChatId, userId, trimmedText, replyToId, isForwarded ? 1 : 0],
        function (err) {
          if (err) {
            console.error('Failed to save real-time message to DB:', err.message);
            return;
          }

          const tempId = data.tempId || null;
          const messageObj = {
            id: this.lastID || Date.now(),
            tempId: tempId,
            chatId: targetChatId,
            conversationId: targetChatId,
            senderId: userId,
            senderName: socket.user.fullName,
            text: trimmedText,
            content: trimmedText,
            replyToId,
            isForwarded,
            isEdited: false,
            isDeleted: false,
            readAt: null,
            reactions: [],
            createdAt: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          // Send confirmation back to sender
          socket.emit('message_sent', messageObj);

          // Emit to recipient's personal user room (excluding sender)
          if (recipientId) {
            socket.to(`user_${recipientId}`).emit('receive_message', {
              ...messageObj,
              isMe: false
            });
          }

          // Emit to conversation room (excluding sender)
          socket.to(`chat_${targetChatId}`).emit('receive_message', messageObj);
        }
      );
    });

    // Handle mark read
    socket.on('mark_read', ({ messageIds, chatId, recipientId }) => {
      if (!messageIds || messageIds.length === 0) return;
      
      const now = new Date().toISOString();
      // Assuming SQLite for simplicity in dev (multiple updates require loop or IN clause)
      const placeholders = messageIds.map(() => '?').join(',');
      db.run(`UPDATE messages SET readAt = ? WHERE id IN (${placeholders})`, [now, ...messageIds], (err) => {
        if (!err) {
          // Notify sender that messages were read
          if (recipientId) {
            io.to(`user_${recipientId}`).emit('messages_read', { messageIds, chatId, readAt: now });
          }
          io.to(`chat_${chatId}`).emit('messages_read', { messageIds, chatId, readAt: now });
        }
      });
    });

    // Handle reactions
    socket.on('add_reaction', ({ messageId, chatId, emoji, recipientId }) => {
      db.run(
        'INSERT INTO message_reactions (messageId, userId, emoji) VALUES (?, ?, ?)',
        [messageId, userId, emoji],
        function (err) {
          if (!err) {
            const reaction = { id: this.lastID, messageId, userId, userName: socket.user.fullName, emoji };
            if (recipientId) io.to(`user_${recipientId}`).emit('message_reaction_added', { chatId, reaction });
            io.to(`chat_${chatId}`).emit('message_reaction_added', { chatId, reaction });
          }
        }
      );
    });

    // Handle edit message
    socket.on('edit_message', ({ messageId, chatId, newText, recipientId }) => {
      db.run('UPDATE messages SET content = ?, isEdited = 1 WHERE id = ? AND senderId = ?', [newText.trim(), messageId, userId], (err) => {
        if (!err) {
          if (recipientId) io.to(`user_${recipientId}`).emit('message_edited', { messageId, chatId, newText: newText.trim() });
          io.to(`chat_${chatId}`).emit('message_edited', { messageId, chatId, newText: newText.trim() });
        }
      });
    });

    // Handle delete message (distinguishing deleteType: 'everyone' vs 'me')
    socket.on('delete_message', ({ messageId, chatId, recipientId, deleteType = 'everyone' }) => {
      if (!messageId) return;

      if (deleteType === 'me') {
        db.run(
          'INSERT INTO deleted_messages_for_user (messageId, userId) VALUES (?, ?) ON CONFLICT DO NOTHING',
          [messageId, userId],
          (err) => {
            if (!err) {
              socket.emit('message_deleted_me', { messageId, chatId });
            }
          }
        );
      } else {
        db.get('SELECT senderid, senderId FROM messages WHERE id = ?', [messageId], (err, msg) => {
          if (err || !msg) return;
          const msgSenderId = msg.senderid || msg.senderId;

          if (String(msgSenderId) !== String(userId)) {
            return socket.emit('error', { message: 'Unauthorized: Only the sender can delete a message for everyone' });
          }

          db.run('UPDATE messages SET content = "", isDeleted = 1 WHERE id = ?', [messageId], (uErr) => {
            if (!uErr) {
              db.run('DELETE FROM message_reactions WHERE messageid = ? OR messageId = ?', [messageId, messageId], () => {});

              if (recipientId) io.to(`user_${recipientId}`).emit('message_deleted', { messageId, chatId, deleteType: 'everyone' });
              if (chatId) io.to(`chat_${chatId}`).emit('message_deleted', { messageId, chatId, deleteType: 'everyone' });
            }
          });
        });
      }
    });

    // Handle typing notifications
    socket.on('typing', (data = {}) => {
      const targetChatId = data.chatId || data.conversationId;
      const recipientId = data.recipientId;
      const isTyping = data.isTyping;

      if (recipientId) {
        io.to(`user_${recipientId}`).emit('user_typing', {
          chatId: targetChatId,
          conversationId: targetChatId,
          userId,
          isTyping
        });
      }
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
      console.log(`🔌 User disconnected: ${socket.user.fullName} (ID: ${userId})`);
    });
  });

  return io;
};

export const isUserOnline = (userId) => {
  if (!userId) return false;
  const idNum = Number(userId);
  const idStr = String(userId);
  return onlineUsers.has(idNum) || onlineUsers.has(idStr);
};
