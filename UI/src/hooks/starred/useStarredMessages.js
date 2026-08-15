import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api/client';

export const useStarredMessages = () => {
  const [starredMessages, setStarredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStarredMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/messages/starred').catch(() => ({ messages: [] }));
      setStarredMessages(data.messages || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch starred messages');
      setLoading(false);
    }
  }, []);

  const unstarMessage = useCallback((messageId) => {
    setStarredMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  useEffect(() => {
    fetchStarredMessages();
  }, [fetchStarredMessages]);

  return {
    starredMessages,
    loading,
    error,
    unstarMessage,
    refreshStarredMessages: fetchStarredMessages
  };
};

export default useStarredMessages;
