import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const StarredContext = createContext({
  starredMessages: [],
  isStarred: () => false,
  toggleStarMessage: () => {},
  unstarMessage: () => {}
});

export const StarredProvider = ({ children }) => {
  const { user: currentUser } = useAuth();

  const [starredMessages, setStarredMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chatapp_starred_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('chatapp_starred_messages', JSON.stringify(starredMessages));
    } catch (e) {
      console.error('Failed to save starred messages:', e);
    }
  }, [starredMessages]);

  const isStarred = useCallback((msgId) => {
    if (!msgId) return false;
    return starredMessages.some((m) => String(m.id) === String(msgId));
  }, [starredMessages]);

  const toggleStarMessage = useCallback((msg, activeChat) => {
    if (!msg) return;
    const msgId = msg.id;

    setStarredMessages((prev) => {
      const exists = prev.some((m) => String(m.id) === String(msgId));
      if (exists) {
        return prev.filter((m) => String(m.id) !== String(msgId));
      }

      const isMe = Boolean(
        msg.isMe || 
        msg.senderId === 'me' || 
        msg.senderId === currentUser?.id || 
        msg.sender === 'You'
      );

      const senderDisplayName = isMe 
        ? 'You' 
        : (msg.senderName || msg.sender || activeChat?.name || 'User');

      const newStarredItem = {
        id: msg.id,
        text: msg.text || msg.message || msg.content || '',
        chatId: activeChat?.id || msg.conversationId,
        chatName: activeChat?.name || 'Chat',
        chatAvatar: activeChat?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeChat?.name || 'User')}`,
        sender: senderDisplayName,
        senderId: isMe ? currentUser?.id : (msg.senderId || activeChat?.contactId),
        isMe,
        date: msg.date || new Date().toLocaleDateString(),
        time: msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: msg.createdAt || new Date().toISOString()
      };

      return [newStarredItem, ...prev];
    });
  }, [currentUser]);

  const unstarMessage = useCallback((msgId) => {
    setStarredMessages((prev) => prev.filter((m) => String(m.id) !== String(msgId)));
  }, []);

  return (
    <StarredContext.Provider
      value={{
        starredMessages,
        isStarred,
        toggleStarMessage,
        unstarMessage
      }}
    >
      {children}
    </StarredContext.Provider>
  );
};

export const useStarred = () => {
  const context = useContext(StarredContext);
  if (!context) {
    throw new Error('useStarred must be used within a StarredProvider');
  }
  return context;
};
