import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api/client';

export const useContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/users/search?q=a');
      const usersList = data?.users || data?.contacts || [];
      setContacts(usersList);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load contacts');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    loading,
    error,
    refreshContacts: fetchContacts
  };
};

export default useContacts;
