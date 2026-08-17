import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaTimes, FaCheck, FaClock, FaCommentDots } from 'react-icons/fa';
import { apiRequest } from '../../api/client';

const SearchModal = ({ isOpen, onClose, onSelectUser, onSendFriendRequest, onAcceptRequest }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
        setUsers(data.users || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const handleSendRequest = async (e, userId) => {
    e.stopPropagation();
    setActionLoadingId(userId);
    try {
      if (onSendFriendRequest) {
        await onSendFriendRequest(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, relationship: 'request_sent' } : u))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to send request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccept = async (e, reqId, userId) => {
    e.stopPropagation();
    setActionLoadingId(userId);
    try {
      if (onAcceptRequest) {
        await onAcceptRequest(reqId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, relationship: 'friend' } : u))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to accept request');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <FaUserPlus className="text-emerald-400" />
            <span>Find People & Add Friends</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            autoFocus
          />
        </div>

        {/* User List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Searching registered users...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              {query ? 'No matching users found.' : 'No registered users found.'}
            </div>
          ) : (
            users.map((u) => {
              const rel = u.relationship || 'none';
              const isLoading = actionLoadingId === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    if (onSelectUser) onSelectUser(u);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                          alt={u.fullName}
                          className="w-10 h-10 rounded-full border border-slate-700 object-cover bg-slate-800"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition truncate">{u.fullName}</h4>
                        <p className="text-xs text-slate-400 truncate font-mono">{u.email}</p>
                      </div>
                    </div>

                    {/* DYNAMIC RELATIONSHIP ACTIONS */}
                    {rel === 'friend' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStartChat) onStartChat(u);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1 shrink-0 shadow-sm shadow-emerald-500/20"
                      >
                        <FaCommentDots />
                        <span>Message</span>
                      </button>
                    ) : rel === 'request_sent' ? (
                      <span className="px-3 py-1.5 bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-semibold rounded-xl shrink-0 flex items-center space-x-1">
                        <FaClock />
                        <span>Request Sent</span>
                      </span>
                    ) : rel === 'request_received' ? (
                      <button
                        disabled={isLoading}
                        onClick={(e) => handleAccept(e, u.incomingRequestId, u.id)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1 shrink-0 shadow-sm shadow-emerald-500/20"
                      >
                        <FaCheck />
                        <span>{isLoading ? 'Accepting...' : 'Accept'}</span>
                      </button>
                    ) : (
                      <button
                        disabled={isLoading}
                        onClick={(e) => handleSendRequest(e, u.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold rounded-xl transition border border-emerald-500/30 shrink-0"
                      >
                        {isLoading ? 'Sending...' : '+ Add Friend'}
                      </button>
                    )}
                  </div>

                  {/* Status Quote */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span className="italic truncate max-w-[220px]">"{u.status || 'Available on ChatApp Pro'}"</span>
                    <span className="text-slate-500 shrink-0 font-medium">
                      {rel === 'friend' ? '✓ Friend' : rel === 'request_sent' ? 'Pending' : 'User'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchModal;
