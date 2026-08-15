import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useChatSelection = (setConversations) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isChatsRoute = location.pathname.includes('/app/chats');
  const urlChatId = isChatsRoute ? location.pathname.split('/app/chats/')[1] : null;

  const [activeChatId, setActiveChatId] = useState(urlChatId || null);
  const [mobileView, setMobileView] = useState('sidebar');

  useEffect(() => {
    if (urlChatId && String(urlChatId) !== String(activeChatId)) {
      setActiveChatId(urlChatId);
    } else if (!urlChatId && activeChatId) {
      setActiveChatId(null);
    }
  }, [urlChatId]);

  const selectChat = useCallback(
    (id) => {
      navigate(`/app/chats/${id}`);
      setMobileView('chat');
      if (setConversations) {
        setConversations((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? { ...c, unreadCount: 0, hasUnread: false } : c))
        );
      }
    },
    [navigate, setConversations]
  );

  const backToSidebar = useCallback(() => {
    navigate('/app/chats');
    setMobileView('sidebar');
  }, [navigate]);

  return {
    activeChatId,
    setActiveChatId,
    mobileView,
    setMobileView,
    isChatsRoute,
    selectChat,
    backToSidebar
  };
};

export default useChatSelection;
