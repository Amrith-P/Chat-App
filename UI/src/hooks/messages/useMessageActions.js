import { useCallback } from 'react';
import { useSocket } from '../socket/useSocket';

export const useMessageActions = (activeChatId, recipientId) => {
  const { socket } = useSocket();

  const handleMessageAction = useCallback(
    (action, payload) => {
      if (!socket || !activeChatId) return;

      if (action === 'delete') {
        socket.emit('delete_message', { messageId: payload.messageId, chatId: activeChatId, recipientId });
      } else if (action === 'edit') {
        socket.emit('edit_message', { messageId: payload.messageId, newText: payload.newText, chatId: activeChatId, recipientId });
      } else if (action === 'react') {
        socket.emit('add_reaction', { messageId: payload.messageId, emoji: payload.emoji, chatId: activeChatId, recipientId });
      }
    },
    [socket, activeChatId, recipientId]
  );

  return {
    handleMessageAction
  };
};

export default useMessageActions;
