import { useState, useCallback } from 'react';

export const useAsync = (asyncFunction) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await asyncFunction(...args);
        setData(response);
        setLoading(false);
        return response;
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);
        throw err;
      }
    },
    [asyncFunction]
  );

  return { execute, loading, data, error, setData, setError };
};

export default useAsync;
