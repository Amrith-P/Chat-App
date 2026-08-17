import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../api/client';
import { useSocket } from '../socket/useSocket';
import { useSocketEvent } from '../socket/useSocketEvent';

export const useFriends = () => {
  const { socket, isConnected } = useSocket();
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingCount, setIncomingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch Friends list
  const refreshFriends = useCallback(async () => {
    try {
      const data = await apiRequest('/friends');
      if (data && data.friends) {
        setFriends(data.friends);
      }
    } catch (err) {
      console.error('Failed to fetch friends list:', err.message);
    }
  }, []);

  // Fetch Friend Requests
  const refreshRequests = useCallback(async () => {
    try {
      const data = await apiRequest('/friend-requests/requests');
      if (data) {
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
        setIncomingCount((data.incoming || []).length);
      }
    } catch (err) {
      console.error('Failed to fetch friend requests:', err.message);
    }
  }, []);

  // Fetch Incoming Request Count for sidebar badge
  const refreshRequestCount = useCallback(async () => {
    try {
      const data = await apiRequest('/friend-requests/requests/count');
      if (data && typeof data.incomingCount === 'number') {
        setIncomingCount(data.incomingCount);
      }
    } catch (err) {
      console.error('Failed to fetch friend request count:', err.message);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([refreshFriends(), refreshRequests(), refreshRequestCount()])
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshFriends, refreshRequests, refreshRequestCount]);

  // Send Friend Request
  const sendFriendRequest = useCallback(async (receiverId) => {
    try {
      const res = await apiRequest('/friend-requests/requests', 'POST', { receiverId });
      await refreshRequests();
      return res;
    } catch (err) {
      if (err.message && (err.message.includes('already pending') || err.message.includes('already friends'))) {
        await Promise.all([refreshRequests(), refreshFriends()]);
        return { status: 'pending', message: err.message };
      }
      throw err;
    }
  }, [refreshRequests, refreshFriends]);

  // Accept Friend Request
  const acceptFriendRequest = useCallback(async (requestId) => {
    const res = await apiRequest(`/friend-requests/requests/${requestId}/accept`, 'POST');
    await Promise.all([refreshFriends(), refreshRequests(), refreshRequestCount()]);
    return res;
  }, [refreshFriends, refreshRequests, refreshRequestCount]);

  // Reject / Decline Friend Request
  const rejectFriendRequest = useCallback(async (requestId) => {
    const res = await apiRequest(`/friend-requests/requests/${requestId}/reject`, 'POST');
    await Promise.all([refreshRequests(), refreshRequestCount()]);
    return res;
  }, [refreshRequests, refreshRequestCount]);

  // Cancel Pending Friend Request
  const cancelFriendRequest = useCallback(async (requestId) => {
    const res = await apiRequest(`/friend-requests/requests/${requestId}`, 'DELETE');
    await refreshRequests();
    return res;
  }, [refreshRequests]);

  // Remove Friend (Unfriend)
  const removeFriend = useCallback(async (friendId) => {
    const res = await apiRequest(`/friends/${friendId}`, 'DELETE');
    await refreshFriends();
    return res;
  }, [refreshFriends]);

  // Socket Listener: Real-time Incoming Friend Request
  useSocketEvent('friend_request_received', (data) => {
    console.log('⚡ Friend request received in real-time:', data);
    setIncomingCount((prev) => prev + 1);
    refreshRequests();
  }, [refreshRequests]);

  // Socket Listener: Real-time Friendship Created / Request Accepted
  useSocketEvent('friendship_created', () => {
    console.log('⚡ Friendship created event received!');
    refreshFriends();
    refreshRequests();
    refreshRequestCount();
  }, [refreshFriends, refreshRequests, refreshRequestCount]);

  useSocketEvent('friend_request_accepted', () => {
    refreshFriends();
    refreshRequests();
    refreshRequestCount();
  }, [refreshFriends, refreshRequests, refreshRequestCount]);

  // Socket Listener: Real-time Request Cancelled/Rejected/Removed
  useSocketEvent('friend_request_cancelled', () => {
    refreshRequests();
    refreshRequestCount();
  }, [refreshRequests, refreshRequestCount]);

  useSocketEvent('friendship_removed', () => {
    refreshFriends();
  }, [refreshFriends]);

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    incomingCount,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    refreshFriends,
    refreshRequests,
    refreshRequestCount
  };
};
