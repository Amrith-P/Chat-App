import { useState, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';

export const useProfile = () => {
  const { user, updateProfile, error: authError, setError } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleUpdateProfile = useCallback(
    async (fullName, status, avatar) => {
      setUpdating(true);
      try {
        const res = await updateProfile(fullName, status, avatar);
        setUpdating(false);
        return res;
      } catch (err) {
        setUpdating(false);
        throw err;
      }
    },
    [updateProfile]
  );

  return {
    user,
    updating,
    error: authError,
    setError,
    updateProfile: handleUpdateProfile
  };
};

export default useProfile;
