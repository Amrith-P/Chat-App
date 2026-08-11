import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // { conversationId: { userId: boolean } }

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Determine Backend Host URL for WebSocket
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
    const socketHost = rawApiUrl.replace(/\/api\/?$/, '');

    const newSocket = io(socketHost, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to backend real-time engine:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket disconnected from backend');
      setIsConnected(false);
    });

    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    newSocket.on('user_typing', ({ conversationId, userId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || {}),
          [userId]: isTyping
        }
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  // Socket action helpers
  const emitSendMessage = (data) => {
    if (socket && isConnected) {
      socket.emit('send_message', data);
    }
  };

  const emitTyping = (conversationId, recipientId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { conversationId, recipientId, isTyping });
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    typingUsers,
    emitSendMessage,
    emitTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
