import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Map of userId -> Set of active socket IDs
const onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
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
    const userId = socket.user.id;
    console.log(`⚡ User connected to WebSocket: ${socket.user.fullName} (ID: ${userId})`);

    // Track online user sockets
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal user room for direct messaging
    socket.join(`user_${userId}`);

    // Broadcast online status to all sockets
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

      if (!targetChatId || !targetText || !targetText.trim()) {
        console.warn('⚠️ Invalid send_message payload received:', data);
        return;
      }

      const trimmedText = targetText.trim();

      // Store in database (SQLite or PostgreSQL)
      db.run(
        'INSERT INTO messages (conversationId, senderId, content) VALUES (?, ?, ?)',
        [targetChatId, userId, trimmedText],
        function (err) {
          if (err) {
            console.error('Failed to save real-time message to DB:', err.message);
            return;
          }

          const messageObj = {
            id: this.lastID || Date.now(),
            chatId: targetChatId,
            conversationId: targetChatId,
            senderId: userId,
            senderName: socket.user.fullName,
            text: trimmedText,
            content: trimmedText,
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
