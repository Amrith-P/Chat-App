import { useEffect, useRef, useState, useCallback } from 'react';

export const useAutoScroll = (dependencyArray = []) => {
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIfAtBottom = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const bottomThreshold = 100;
    const atBottom = scrollHeight - scrollTop - clientHeight <= bottomThreshold;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom('auto');
    }
  }, dependencyArray);

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    checkIfAtBottom
  };
};

export default useAutoScroll;
