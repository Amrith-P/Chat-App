import { useCallback } from 'react';
import { useSocket } from '../socket/useSocket';

export const useMessageReactions = (activeChatId, recipientId) => {
  const { socket } = useSocket();

  const addReaction = useCallback(
    (messageId, emoji) => {
      if (!socket || !activeChatId || !messageId || !emoji) return;
      socket.emit('add_reaction', { messageId, emoji, chatId: activeChatId, recipientId });
    },
    [socket, activeChatId, recipientId]
  );

  return {
    addReaction
  };
};

export default useMessageReactions;
