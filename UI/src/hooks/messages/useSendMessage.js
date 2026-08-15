import { useState, useCallback } from 'react';
import { useSocket } from '../socket/useSocket';

export const useSendMessage = (activeChatId, recipientId) => {
  const { emitSendMessage } = useSocket();
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(
    (text, replyToId = null) => {
      const trimmed = text ? text.trim() : '';
      if (!trimmed || !activeChatId) return false;

      setSending(true);
      emitSendMessage({
        chatId: activeChatId,
        conversationId: activeChatId,
        recipientId,
        text: trimmed,
        replyToId
      });
      setSending(false);
      return true;
    },
    [activeChatId, recipientId, emitSendMessage]
  );

  return {
    sendMessage,
    sending
  };
};

export default useSendMessage;
