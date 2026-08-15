import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSocket } from './useSocket';

export const useTypingIndicator = (conversationId, recipientId) => {
  const { emitTyping, typingUsers } = useSocket();
  const typingTimeoutRef = useRef(null);

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    emitTyping(conversationId, recipientId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(conversationId, recipientId, false);
    }, 2000);
  }, [conversationId, recipientId, emitTyping]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    emitTyping(conversationId, recipientId, false);
  }, [conversationId, recipientId, emitTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const isOtherUserTyping = useMemo(() => {
    if (!conversationId || !typingUsers[conversationId]) return false;
    const convTyping = typingUsers[conversationId];
    if (recipientId && convTyping[recipientId]) return true;
    return Object.values(convTyping).some(Boolean);
  }, [conversationId, recipientId, typingUsers]);

  return {
    startTyping,
    stopTyping,
    isOtherUserTyping
  };
};

export default useTypingIndicator;
