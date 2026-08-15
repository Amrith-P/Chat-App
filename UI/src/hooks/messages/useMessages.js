import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../auth/useAuth';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  let iso = String(dateStr);
  if (!iso.includes('T')) iso = iso.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d) ? new Date() : d;
};

export const useMessages = (activeChatId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const fetchMessages = useCallback(async () => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    const targetChatId = activeChatId;

    try {
      const data = await apiRequest(`/messages/${targetChatId}`);
      if (String(activeChatIdRef.current) === String(targetChatId)) {
        if (data && data.messages) {
          const formattedMsgs = data.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            isMe: m.senderId === user?.id,
            text: m.text,
            replyToId: m.replyToId,
            isForwarded: Boolean(m.isForwarded),
            isEdited: Boolean(m.isEdited),
            isDeleted: Boolean(m.isDeleted),
            readAt: m.readAt,
            reactions: m.reactions || [],
            time: parseDate(m.createdAt || m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: parseDate(m.createdAt || m.time).toLocaleDateString()
          }));
          setMessages(formattedMsgs);
        }
        setLoading(false);
      }
    } catch (err) {
      if (String(activeChatIdRef.current) === String(targetChatId)) {
        setError(err.message || 'Failed to fetch messages');
        setLoading(false);
      }
    }
  }, [activeChatId, user?.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    setMessages,
    loading,
    error,
    refreshMessages: fetchMessages
  };
};

export default useMessages;
