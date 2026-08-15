import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useLogin = () => {
  const { login, register, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);

  const performLogin = useCallback(
    async (email, password) => {
      if (!email || !password) {
        setError('Please fill in both email and password.');
        return false;
      }
      setLoading(true);
      setError(null);
      try {
        await login(email, password);
        setLoading(false);
        return true;
      } catch (err) {
        setLoading(false);
        return false;
      }
    },
    [login, setError]
  );

  const performDemoLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        await login('alex.demo@chatapp.com', 'password123');
      } catch (loginErr) {
        await register('Alex Morgan (Demo)', 'alex.demo@chatapp.com', 'password123');
      }
      setLoading(false);
      return true;
    } catch (err) {
      setError('Demo login failed: ' + err.message);
      setLoading(false);
      return false;
    }
  }, [login, register, setError]);

  return {
    performLogin,
    performDemoLogin,
    loading,
    error
  };
};

export default useLogin;
