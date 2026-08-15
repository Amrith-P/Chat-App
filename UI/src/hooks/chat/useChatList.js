import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../auth/useAuth';
import { usePresence } from '../socket/usePresence';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  let iso = String(dateStr);
  if (!iso.includes('T')) iso = iso.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d) ? new Date() : d;
};

export const useChatList = () => {
  const { user } = useAuth();
  const { isUserOnline } = usePresence();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/chats');
      if (data && data.chats) {
        const formatted = data.chats.map((c) => {
          const rawTime = c.lastMessageTime || c.time;
          const isSpecial = !rawTime || rawTime === 'Just now' || rawTime === 'New';
          const displayTime = isSpecial
            ? (rawTime || 'New')
            : parseDate(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const contactId = c.contactId || c.recipientId;

          return {
            id: c.id,
            name: c.name || c.recipientName || 'User',
            email: c.email || c.recipientEmail || '',
            avatar: c.avatar || c.recipientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name || 'User')}`,
            recipientId: contactId,
            contactId,
            lastMessage: c.lastMessage || 'No messages yet. Say hi!',
            time: displayTime,
            timestamp: c.lastMessageTime ? parseDate(c.lastMessageTime).getTime() : 0,
            unreadCount: c.unreadCount || 0,
            isOnline: isUserOnline(contactId),
            isFavorite: Boolean(c.isFavorite),
            status: c.status || 'Available'
          };
        }).sort((a, b) => b.timestamp - a.timestamp);

        setConversations(formatted);
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch conversations');
      setLoading(false);
    }
  }, [user, isUserOnline]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Dynamically sync online status
  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => {
        const contactId = c.contactId || c.recipientId;
        const isOnline = isUserOnline(contactId);
        return c.isOnline === isOnline ? c : { ...c, isOnline };
      })
    );
  }, [isUserOnline]);

  return {
    conversations,
    setConversations,
    loading,
    error,
    refreshConversations: fetchConversations
  };
};

export default useChatList;
