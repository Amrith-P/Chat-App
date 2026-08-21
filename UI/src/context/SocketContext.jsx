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
    const socketHost = import.meta.env.VITE_SOCKET_URL || (
      import.meta.env.MODE === 'development'
        ? 'http://localhost:10000'
        : 'https://chat-app-0yh9.onrender.com'
    );

    const newSocket = io(socketHost, {
      auth: { token },
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to backend real-time engine:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket disconnected from backend');
      setIsConnected(false);
    });

    newSocket.on('online_users_list', ({ userIds }) => {
      if (Array.isArray(userIds)) {
        const set = new Set();
        userIds.forEach((id) => {
          set.add(Number(id));
          set.add(String(id));
        });
        setOnlineUsers(set);
      }
    });

    newSocket.on('user_online', ({ userId }) => {
      if (userId !== undefined && userId !== null) {
        setOnlineUsers((prev) => new Set([...prev, Number(userId), String(userId)]));
      }
    });

    newSocket.on('user_offline', ({ userId }) => {
      if (userId !== undefined && userId !== null) {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(Number(userId));
          updated.delete(String(userId));
          return updated;
        });
      }
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
  }, [token, user?.id]);

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
