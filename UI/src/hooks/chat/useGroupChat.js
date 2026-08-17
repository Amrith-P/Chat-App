import { useState, useCallback } from 'react';
import { apiRequest } from '../../api/client';

export const useGroupChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/groups', 'POST', groupData);
      setLoading(false);
      return res.group;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const getGroupDetails = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}`, 'GET');
      setLoading(false);
      return res.group;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const getGroupMembers = useCallback(async (groupId) => {
    try {
      const res = await apiRequest(`/groups/${groupId}/members`, 'GET');
      return res.members || [];
    } catch (err) {
      console.error('Failed to fetch group members:', err);
      return [];
    }
  }, []);

  const addGroupMembers = useCallback(async (groupId, memberIds) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}/members`, 'POST', { memberIds });
      setLoading(false);
      return res.members;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const removeGroupMember = useCallback(async (groupId, userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}/members/${userId}`, 'DELETE');
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const updateMemberRole = useCallback(async (groupId, userId, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}/members/${userId}/role`, 'PATCH', { role });
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const updateGroupSettings = useCallback(async (groupId, settings) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}`, 'PATCH', settings);
      setLoading(false);
      return res.group;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const leaveGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}/leave`, 'POST');
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteGroup = useCallback(async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest(`/groups/${groupId}`, 'DELETE');
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    createGroup,
    getGroupDetails,
    getGroupMembers,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    updateGroupSettings,
    leaveGroup,
    deleteGroup
  };
};

export default useGroupChat;
