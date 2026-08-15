import { useState } from 'react';
import { useAuth } from '../auth/useAuth';

export const useSettings = () => {
  const { user, updateProfile, changePassword, revokeAllSessions, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return {
    user,
    notificationsEnabled,
    setNotificationsEnabled,
    readReceiptsEnabled,
    setReadReceiptsEnabled,
    darkMode,
    setDarkMode,
    updateProfile,
    changePassword,
    revokeAllSessions,
    logout
  };
};

export default useSettings;
