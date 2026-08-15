import { useMemo } from 'react';
import { usePresence } from '../socket/usePresence';

export const useUserStatus = (userId, rawStatusText = '') => {
  const { isUserOnline } = usePresence();
  const online = isUserOnline(userId);

  const statusLabel = useMemo(() => {
    if (online) return 'Online • Available';
    return rawStatusText || 'Last seen recently';
  }, [online, rawStatusText]);

  return {
    isOnline: online,
    statusLabel
  };
};

export default useUserStatus;
