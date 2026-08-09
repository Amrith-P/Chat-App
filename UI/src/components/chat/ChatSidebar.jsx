import React, { useState } from 'react';
import { FaSearch, FaPlus, FaCheckDouble, FaCircle, FaStar, FaFilter } from 'react-icons/fa';

const ChatSidebar = ({ conversations, activeChatId, onSelectChat, onOpenNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'favorites'

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'unread') return matchesSearch && c.unreadCount > 0;
    if (filter === 'favorites') return matchesSearch && c.isFavorite;
    return matchesSearch;
  });

  return (
    <div className="w-full h-full bg-slate-900/90 border-r border-slate-800 flex flex-col select-none">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
              {conversations.length}
            </span>
          </div>

          <button
            onClick={onOpenNewChat}
            title="Start New Chat"
            className="w-9 h-9 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center font-bold transition shadow-lg shadow-emerald-500/20"
          >
            <FaPlus className="text-sm" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3 text-slate-500 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages or contacts..."
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 pt-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filter === 'unread'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filter === 'favorites'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <p>No conversations found.</p>
            <button
              onClick={onOpenNewChat}
              className="text-emerald-400 font-semibold hover:underline"
            >
              Start a new chat +
            </button>
          </div>
        ) : (
          filteredConversations.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                  isActive
                    ? 'bg-slate-800/90 border border-slate-700/80 shadow-md'
                    : 'hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {/* Active Bar Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r-full" />
                )}

                {/* Contact Avatar */}
                <div className="relative shrink-0 mr-3">
                  <img
                    src={chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chat.name)}`}
                    alt={chat.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700"
                  />
                  {chat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm truncate ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                      {chat.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 shrink-0">{chat.time}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-1 truncate pr-2">
                      <FaCheckDouble className="text-emerald-400 text-[10px] shrink-0" />
                      <span className={`truncate ${chat.unreadCount > 0 ? 'font-semibold text-slate-200' : ''}`}>
                        {chat.lastMessage}
                      </span>
                    </div>

                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default ChatSidebar;
