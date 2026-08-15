import { useState, useCallback } from 'react';

export const useSettingsForm = (initialProfile = {}) => {
  const [fullName, setFullName] = useState(initialProfile.fullName || '');
  const [status, setStatus] = useState(initialProfile.status || 'Available');
  const [avatar, setAvatar] = useState(initialProfile.avatar || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const resetForm = useCallback((profile = {}) => {
    setFullName(profile.fullName || '');
    setStatus(profile.status || 'Available');
    setAvatar(profile.avatar || '');
    setSuccess('');
    setError('');
  }, []);

  return {
    fullName,
    setFullName,
    status,
    setStatus,
    avatar,
    setAvatar,
    saving,
    setSaving,
    success,
    setSuccess,
    error,
    setError,
    resetForm
  };
};

export default useSettingsForm;
