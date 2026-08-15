// Auth hooks
export { useAuth } from './auth/useAuth';
export { useLogin } from './auth/useLogin';
export { useRegister } from './auth/useRegister';

// Chat hooks
export { useChat } from './chat/useChat';
export { useChatList } from './chat/useChatList';
export { useChatActions } from './chat/useChatActions';
export { useChatSelection } from './chat/useChatSelection';
export { useUnreadMessages } from './chat/useUnreadMessages';

// Message hooks
export { useMessages } from './messages/useMessages';
export { useSendMessage } from './messages/useSendMessage';
export { useMessageActions } from './messages/useMessageActions';
export { useMessageReactions } from './messages/useMessageReactions';
export { useMessagePagination } from './messages/useMessagePagination';

// Socket hooks
export { useSocket } from './socket/useSocket';
export { useSocketEvent } from './socket/useSocketEvent';
export { useTypingIndicator } from './socket/useTypingIndicator';
export { usePresence } from './socket/usePresence';

// User hooks
export { useUserSearch } from './users/useUserSearch';
export { useContacts } from './users/useContacts';
export { useProfile } from './users/useProfile';
export { useUserStatus } from './users/useUserStatus';

// Settings hooks
export { useSettings } from './settings/useSettings';
export { useSettingsForm } from './settings/useSettingsForm';

// Starred hooks
export { useStarredMessages } from './starred/useStarredMessages';

// UI Utility hooks
export { useDebounce } from './ui/useDebounce';
export { useAutoScroll } from './ui/useAutoScroll';
export { useOnlineStatus } from './ui/useOnlineStatus';
export { useMediaQuery } from './ui/useMediaQuery';
export { useClickOutside } from './ui/useClickOutside';
export { useEscapeKey } from './ui/useEscapeKey';
export { useConfirm } from './ui/useConfirm';
export { useAsync } from './ui/useAsync';
export { usePrevious } from './ui/usePrevious';
