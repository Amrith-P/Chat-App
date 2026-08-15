import { useEffect } from 'react';
import { useSocket } from './useSocket';

export const useSocketEvent = (event, handler) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !event || !handler) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
};

export default useSocketEvent;
