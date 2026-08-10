import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaTimes, FaCircle } from 'react-icons/fa';
import { apiRequest } from '../../api/client';

const SearchModal = ({ isOpen, onClose, onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <FaUserPlus className="text-emerald-400" />
            <span>New Conversation</span>
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
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-sm">Searching users...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              {query ? 'No matching users found.' : 'No registered users available.'}
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  onClose();
                }}
                className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/90 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover group-hover:border-emerald-400 transition"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white group-hover:text-emerald-300 transition">{u.fullName}</h4>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-xs font-bold rounded-lg transition border border-emerald-500/20 shrink-0">
                    Chat
                  </button>
                </div>

                {/* Additional User Details */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                  <span className="italic truncate max-w-[200px]">"{u.status || 'Hey there! I am using ChatApp.'}"</span>
                  <span className="text-slate-500 shrink-0 font-medium">
                    {u.createdAt ? `Joined ${new Date(u.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}` : 'Member'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default SearchModal;
