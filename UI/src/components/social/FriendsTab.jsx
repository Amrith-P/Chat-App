import React, { useState } from 'react';
import { 
  FaSearch, 
  FaUserFriends, 
  FaCommentDots, 
  FaUserMinus, 
  FaUserPlus, 
  FaShieldAlt, 
  FaTimes 
} from 'react-icons/fa';
import ConfirmModal from '../common/ConfirmModal';

const FriendsTab = ({ friends = [], loading, onStartChat, onRemoveFriend, onOpenGlobalSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  const filteredFriends = friends.filter((f) => {
    const term = searchTerm.toLowerCase();
    return (
      (f.name || f.fullName || '').toLowerCase().includes(term) ||
      (f.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full h-full bg-slate-900/95 flex flex-col select-none overflow-hidden border-r border-slate-800">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaUserFriends className="text-emerald-400 text-lg" />
            <h2 className="text-xl font-bold text-white tracking-tight">Friends</h2>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
              {friends.length}
            </span>
          </div>

          <button
            onClick={onOpenGlobalSearch}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <FaUserPlus />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Friends Search Input */}
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3 text-slate-500 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search my friends..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Friends List Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading friends...
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 text-2xl mx-auto">
              👥
            </div>
            <h4 className="text-sm font-bold text-slate-200">
              {searchTerm ? 'No matching friends found' : 'No friends yet'}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              {searchTerm 
                ? 'Try searching with a different name or email address.' 
                : 'Connect with people you know on ChatApp Pro to start private messaging.'}
            </p>
            {!searchTerm && (
              <button
                onClick={onOpenGlobalSearch}
                className="mt-2 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                <FaUserPlus />
                <span>Find People to Add</span>
              </button>
            )}
          </div>
        ) : (
          filteredFriends.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="relative shrink-0">
                  <img
                    src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(f.name)}`}
                    alt={f.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700 bg-slate-800"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-950" title="Online" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {f.name}
                  </h3>
                  <p className="text-xs text-slate-400 truncate font-mono">{f.email}</p>
                  {f.status && (
                    <p className="text-[11px] text-slate-500 truncate italic mt-0.5">"{f.status}"</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => onStartChat(f)}
                  title="Message Friend"
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1 shadow-sm shadow-emerald-500/20"
                >
                  <FaCommentDots />
                  <span className="hidden sm:inline">Message</span>
                </button>

                <button
                  onClick={() => setConfirmConfig({
                    title: 'Remove Friend',
                    message: `Are you sure you want to remove ${f.name} from your friends list? You will no longer be able to send private messages.`,
                    confirmText: 'Remove Friend',
                    onConfirm: () => onRemoveFriend(f.id)
                  })}
                  title="Remove Friend"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                >
                  <FaUserMinus className="text-xs" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={() => {
          if (confirmConfig?.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig(null);
        }}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        confirmVariant="danger"
      />

    </div>
  );
};

export default FriendsTab;
