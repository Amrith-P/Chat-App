import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

const DEFAULT_SEEDS = ['Alex', 'Sarah', 'Felix', 'Mimi', 'Jack', 'Luna', 'Zack', 'Maya'];

export const useRegister = () => {
  const { register, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarSeeds, setAvatarSeeds] = useState(DEFAULT_SEEDS);
  const [selectedAvatar, setSelectedAvatar] = useState(
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${DEFAULT_SEEDS[0]}`
  );

  const randomizeAvatars = useCallback(() => {
    const randomSuffix = Math.floor(Math.random() * 1000);
    const newSeeds = DEFAULT_SEEDS.map((seed) => `${seed}_${randomSuffix}`);
    setAvatarSeeds(newSeeds);
    setSelectedAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeeds[0]}`);
  }, []);

  const selectAvatar = useCallback((avatarUrl) => {
    setSelectedAvatar(avatarUrl);
  }, []);

  const performRegister = useCallback(
    async (fullName, email, password) => {
      if (!fullName || !email || !password) {
        setError('Please fill in all registration fields.');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }

      setLoading(true);
      setError(null);
      try {
        await register(fullName, email, password, selectedAvatar);
        setLoading(false);
        return true;
      } catch (err) {
        setLoading(false);
        return false;
      }
    },
    [register, selectedAvatar, setError]
  );

  return {
    performRegister,
    avatarSeeds,
    selectedAvatar,
    randomizeAvatars,
    selectAvatar,
    loading,
    error
  };
};

export default useRegister;
