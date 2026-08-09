import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chat_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('chat_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/auth/me');
        setUser(data.user);
      } catch (err) {
        console.error('Session validation failed:', err);
        localStorage.removeItem('chat_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      localStorage.setItem('chat_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (fullName, email, password) => {
    setError(null);
    try {
      const data = await apiRequest('/auth/register', 'POST', { fullName, email, password });
      localStorage.setItem('chat_token', data.token);
      setToken(data.token);
      setUser(data.user);
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

  const logout = () => {
    localStorage.removeItem('chat_token');
    setToken(null);
    setUser(null);
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
