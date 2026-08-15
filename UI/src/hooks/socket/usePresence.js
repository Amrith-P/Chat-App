import { useCallback } from 'react';
import { useSocket } from './useSocket';

export const usePresence = () => {
  const { onlineUsers } = useSocket();

  const isUserOnline = useCallback(
    (userId) => {
      if (userId === undefined || userId === null) return false;
      return onlineUsers.has(Number(userId)) || onlineUsers.has(String(userId));
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    isUserOnline
  };
};

export default usePresence;
