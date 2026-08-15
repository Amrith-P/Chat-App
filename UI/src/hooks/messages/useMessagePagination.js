import { useState, useCallback } from 'react';

export const useMessagePagination = () => {
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    setLoadingMore(false);
  }, []);

  return {
    hasMore,
    loadingMore,
    loadMore
  };
};

export default useMessagePagination;
