import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRequest } from '../../api/client';
import { useDebounce } from '../ui/useDebounce';

export const useUserSearch = (initialSearchTerm = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({
    contacts: [],
    messages: [],
    users: []
  });
  const [error, setError] = useState(null);
  const activeRequestRef = useRef(0);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults({ contacts: [], messages: [], users: [] });
    setError(null);
  }, []);

  useEffect(() => {
    const trimmed = debouncedSearchTerm.trim();
    if (!trimmed) {
      setSearchResults({ contacts: [], messages: [], users: [] });
      setIsSearching(false);
      return;
    }

    const requestId = ++activeRequestRef.current;
    setIsSearching(true);
    setError(null);

    const performSearch = async () => {
      try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(trimmed)}`);
        if (requestId === activeRequestRef.current) {
          setSearchResults({
            contacts: data.contacts || [],
            messages: data.messages || [],
            users: data.users || []
          });
          setIsSearching(false);
        }
      } catch (err) {
        if (requestId === activeRequestRef.current) {
          setError(err.message || 'Search failed');
          setIsSearching(false);
        }
      }
    };

    performSearch();
  }, [debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    searchResults,
    isSearching,
    error,
    clearSearch
  };
};

export default useUserSearch;
