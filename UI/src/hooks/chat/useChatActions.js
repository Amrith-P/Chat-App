import { useCallback } from 'react';
import { apiRequest } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export const useChatActions = (setConversations, setMessagesMap, activeChatId, setMobileView) => {
  const navigate = useNavigate();

  const deleteChat = useCallback(
    async (chatId) => {
      try {
        await apiRequest(`/chats/${chatId}`, 'DELETE');
        if (setConversations) {
          setConversations((prev) => prev.filter((c) => String(c.id) !== String(chatId)));
        }
        if (setMessagesMap) {
          setMessagesMap((prev) => {
            const updated = { ...prev };
            delete updated[chatId];
            return updated;
          });
        }
        if (String(activeChatId) === String(chatId)) {
          navigate('/app/chats');
          if (setMobileView) setMobileView('sidebar');
        }
      } catch (err) {
        console.error('Failed to delete chat:', err.message);
      }
    },
    [navigate, activeChatId, setConversations, setMessagesMap, setMobileView]
  );

  const clearChat = useCallback(
    async (chatId) => {
      try {
        await apiRequest(`/chats/${chatId}/messages`, 'DELETE');
        if (setMessagesMap) {
          setMessagesMap((prev) => ({
            ...prev,
            [chatId]: []
          }));
        }
        if (setConversations) {
          setConversations((prev) =>
            prev.map((c) =>
              String(c.id) === String(chatId)
                ? { ...c, lastMessage: 'Messages cleared', time: 'Just now' }
                : c
            )
          );
        }
      } catch (err) {
        console.error('Failed to clear chat:', err.message);
      }
    },
    [setConversations, setMessagesMap]
  );

  const toggleFavoriteChat = useCallback(
    async (chatId) => {
      try {
        const res = await apiRequest(`/chats/${chatId}/favorite`, 'POST');
        if (res && res.success && setConversations) {
          setConversations((prev) =>
            prev.map((c) =>
              String(c.id) === String(chatId)
                ? { ...c, isFavorite: Boolean(res.isFavorite) }
                : c
            )
          );
        }
      } catch (err) {
        console.error('Failed to toggle favorite chat:', err.message);
      }
    },
    [setConversations]
  );

  return {
    deleteChat,
    clearChat,
    toggleFavoriteChat
  };
};

export default useChatActions;
