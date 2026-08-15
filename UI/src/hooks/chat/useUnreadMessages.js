import { useMemo, useCallback } from 'react';

export const useUnreadMessages = (conversations, setConversations) => {
  const totalUnreadCount = useMemo(() => {
    return (conversations || []).reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  const clearUnreadForChat = useCallback(
    (chatId) => {
      if (!setConversations || !chatId) return;
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(chatId) ? { ...c, unreadCount: 0, hasUnread: false } : c))
      );
    },
    [setConversations]
  );

  return {
    totalUnreadCount,
    clearUnreadForChat
  };
};

export default useUnreadMessages;
