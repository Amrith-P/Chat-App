import { useMessages } from '../messages/useMessages';
import { useSendMessage } from '../messages/useSendMessage';
import { useMessageActions } from '../messages/useMessageActions';
import { useTypingIndicator } from '../socket/useTypingIndicator';

export const useChat = (activeChatId, activeChat) => {
  const recipientId = activeChat?.recipientId || activeChat?.contactId;
  const { messages, setMessages, loading, error, refreshMessages } = useMessages(activeChatId);
  const { sendMessage, sending } = useSendMessage(activeChatId, recipientId);
  const { handleMessageAction } = useMessageActions(activeChatId, recipientId);
  const { startTyping, stopTyping, isOtherUserTyping } = useTypingIndicator(activeChatId, recipientId);

  return {
    chat: activeChat,
    messages,
    setMessages,
    loading,
    sending,
    error,
    sendMessage,
    handleMessageAction,
    startTyping,
    stopTyping,
    isOtherUserTyping,
    refreshMessages
  };
};

export default useChat;
