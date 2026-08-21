import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAccessToken, getAccessToken } from '../api/client';
import { requestNotificationPermission, sendSystemNotification } from '../utils/notification';
import { getOrGenerateUserKeys } from '../utils/e2ee';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setTokenState] = useState(getAccessToken());
  const [loading, setLoading] = useState(!user && !getAccessToken());
  const [error, setError] = useState(null);

  const setUser = (userData) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('chat_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('chat_user');
    }
  };

  const updateTokenState = (newToken) => {
    setAccessToken(newToken);
    setTokenState(newToken);
  };

  const triggerWelcomeNotification = async (userData) => {
    if (!userData) return;
    const granted = await requestNotificationPermission();
    if (granted) {
      sendSystemNotification('Pulse-X Messenger ⚡', {
        body: `Welcome back, ${userData.fullName || 'User'}! Desktop & push notifications enabled.`
      });
    }
  };

  // Check current session on mount (attempts silent refresh first, then /me)
  useEffect(() => {
    const verifySession = async () => {
      const storedUser = localStorage.getItem('chat_user');
      const storedToken = getAccessToken();

      // If user logged out (no stored user or token in localStorage), do not attempt session restore
      if (!storedUser && !storedToken) {
        updateTokenState(null);
        setUserState(null);
        setLoading(false);
        return;
      }

      try {
        // Attempt silent refresh via HttpOnly Cookie
        const refreshData = await apiRequest('/auth/refresh', 'POST');
        if (refreshData && refreshData.authenticated && refreshData.token) {
          updateTokenState(refreshData.token);
          setUser(refreshData.user);
          setLoading(false);
          triggerWelcomeNotification(refreshData.user);
          return;
        }
      } catch (err) {
        // Silent catch
      }

      // If refresh returned no token or failed, check if we have a valid stored token
      const existingToken = getAccessToken();
      if (existingToken) {
        try {
          const data = await apiRequest('/auth/me');
          setUser(data.user);
          triggerWelcomeNotification(data.user);
        } catch (meErr) {
          updateTokenState(null);
          setUser(null);
        }
      } else {
        updateTokenState(null);
        setUser(null);
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      updateTokenState(data.token);
      setUser(data.user);
      triggerWelcomeNotification(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (fullName, email, password, avatar) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/register', 'POST', { fullName, email, password, avatar });
      updateTokenState(data.token);
      setUser(data.user);
      triggerWelcomeNotification(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/forgot-password', 'POST', { email });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/reset-password', 'POST', { email, resetToken, newPassword });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (fullName, status, avatar, publicKey) => {
    setError(null);
    try {
      const data = await apiRequest('/users/profile', 'PUT', { fullName, status, avatar, publicKey });
      if (data.user) {
        setUser(data.user);
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    if (user?.id) {
      getOrGenerateUserKeys(user.id).then((keys) => {
        if (keys && keys.pubJwk && user.publicKey !== keys.pubJwk) {
          updateProfile(user.fullName, user.status, user.avatar, keys.pubJwk).catch(() => {});
        }
      });
    }
  }, [user?.id, user?.publicKey]);

  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      const data = await apiRequest('/users/change-password', 'PUT', { currentPassword, newPassword });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const revokeAllSessions = async () => {
    setError(null);
    try {
      await apiRequest('/auth/revoke-all', 'POST');
      updateTokenState(null);
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', 'POST');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      updateTokenState(null);
      setUserState(null);
      localStorage.removeItem('chat_user');
      localStorage.removeItem('chat_token');
      sessionStorage.clear();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        login,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        revokeAllSessions,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
