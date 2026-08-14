import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaPlus, 
  FaCheckDouble, 
  FaCircle, 
  FaUserFriends, 
  FaCommentDots, 
  FaUserPlus,
  FaTimes,
  FaArrowRight
} from 'react-icons/fa';
import { apiRequest } from '../../api/client';

const ChatSidebar = ({ conversations, activeChatId, onSelectChat, onOpenNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'favorites'

  // Grouped Search State
  const [searchResults, setSearchResults] = useState({
    contacts: [],
    messages: [],
    users: []
  });
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Grouped Search Handler
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults({ contacts: [], messages: [], users: [] });
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    // 1. Grouped Contacts matching
    const matchedContacts = conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
    );

    // 2. Grouped Messages matching from active conversation streams
    const matchedMessages = conversations
      .filter((c) => c.lastMessage && c.lastMessage.toLowerCase().includes(term))
      .map((c) => ({
        id: c.id,
        chatId: c.id,
        chatName: c.name,
        sender: c.name,
        text: c.lastMessage,
        time: c.time
      }));

    setSearchResults((prev) => ({
      ...prev,
      contacts: matchedContacts,
      messages: matchedMessages
    }));

    // 3. Grouped Database Users search
    const fetchUsers = async () => {
      setIsSearchingDb(true);
      try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(term)}`);
        setSearchResults((prev) => ({
          ...prev,
          users: data?.users || []
        }));
      } catch (err) {
        setSearchResults((prev) => ({
          ...prev,
          users: []
        }));
      } finally {
        setIsSearchingDb(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, conversations]);

  const hasSearchText = searchTerm.trim().length > 0;

  return (
    <div className="w-full h-full bg-slate-900/90 border-r border-slate-800 flex flex-col select-none relative">
      
      {/* HEADER */}
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

        {/* SEARCH BAR */}
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-3 text-slate-500 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts, messages, or users..."
            className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          {hasSearchText && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Filter Pills (shown when not searching) */}
        {!hasSearchText && (
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
        )}
      </div>

      {/* GROUPED SEARCH RESULTS OVERLAY OR CONVERSATION LIST */}
      {hasSearchText ? (
        /* GROUPED RESULTS VIEW */
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar bg-slate-950/60">
          
          {/* GROUP 1: CONTACTS & CONVERSATIONS */}
          {searchResults.contacts.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 px-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                <FaUserFriends className="text-xs" />
                <span>Contacts ({searchResults.contacts.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.contacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectChat(c.id);
                      setSearchTerm('');
                    }}
                    className="flex items-center p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 cursor-pointer transition"
                  >
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-8 h-8 rounded-full object-cover mr-3 border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP 2: MESSAGE SNIPPETS */}
          {searchResults.messages.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 px-2 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                <FaCommentDots className="text-xs" />
                <span>Messages ({searchResults.messages.length})</span>
              </div>
              <div className="space-y-1">
                {searchResults.messages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSearchTerm('')}
                    className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 cursor-pointer transition space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-300">{m.sender} in {m.chatName}</span>
                      <span className="text-slate-500">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 italic bg-slate-950/40 p-1.5 rounded-md border border-slate-800/60">
                      "{m.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUP 3: REGISTERED USERS DISCOVERY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-[11px] font-bold text-purple-400 uppercase tracking-wider">
              <div className="flex items-center space-x-1.5">
                <FaUserPlus className="text-xs" />
                <span>Registered Users ({searchResults.users.length})</span>
              </div>
              {isSearchingDb && <span className="text-[10px] text-slate-500 font-normal">Searching...</span>}
            </div>

            {searchResults.users.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 italic">
                {isSearchingDb ? 'Searching database...' : 'No users found matching search.'}
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onOpenNewChat();
                      setSearchTerm('');
                    }}
                    className="p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800/90 hover:border-purple-500/30 cursor-pointer transition space-y-2 group shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="relative">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`}
                            alt={u.fullName}
                            className="w-9 h-9 rounded-full border border-slate-700 object-cover group-hover:border-purple-400/60 transition"
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition">{u.fullName}</h4>
                          <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>

                      <button className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-slate-950 text-[10px] font-bold rounded-lg transition border border-purple-500/20">
                        Start Chat
                      </button>
                    </div>

                    {/* Detailed Status & Join Info */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="italic truncate max-w-[160px]">"{u.status || 'Hey there! I am using ChatApp.'}"</span>
                      <span className="text-slate-500 shrink-0 font-medium">
                        {u.createdAt ? `Joined ${new Date(u.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}` : 'Member'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      ) : (
        /* STANDARD CONVERSATION LIST */
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {conversations.length === 0 ? (
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
            conversations.map((chat) => {
              const isActive = String(chat.id) === String(activeChatId);
              const isUnread = (chat.unreadCount > 0 || chat.hasUnread) && !isActive;

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
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r-full" />
                  )}

                  <div className="relative shrink-0 mr-3">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-11 h-11 rounded-full object-cover border border-slate-700"
                    />
                    {chat.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <h3 className={`text-sm truncate ${isActive ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                          {chat.name}
                        </h3>
                        {isUnread && (
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse shrink-0" title="Unread Message" />
                        )}
                      </div>
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
      )}

    </div>
  );
};

export default React.memo(ChatSidebar);
