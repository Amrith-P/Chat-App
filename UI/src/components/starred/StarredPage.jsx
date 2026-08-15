import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaStar, FaSearch, FaArrowRight, FaTrash, FaCopy } from 'react-icons/fa';
import { useStarredMessages } from '../../hooks/starred/useStarredMessages';

const StarredPage = () => {
  const { onJumpToChat } = useOutletContext();
  const { starredMessages, unstarMessage: handleUnstar } = useStarredMessages();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = starredMessages.filter(
    (m) =>
      m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
            <FaStar className="text-lg" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Starred Messages</h2>
          <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
            {starredMessages.length} Saved
          </span>
        </div>
      </header>

      {/* BODY */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Search */}
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in starred messages..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* LIST OF STARRED MESSAGES */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 text-2xl mx-auto">
              ⭐
            </div>
            <p className="text-sm font-medium">No starred messages saved yet.</p>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Hover over any message in your chat threads and click the Star icon to bookmark important messages here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {filtered.map((msg) => (
              <div
                key={msg.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition duration-200 shadow-md space-y-3 group"
              >
                {/* Message Sender Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={msg.chatAvatar}
                      alt={msg.chatName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white flex items-center space-x-2">
                        <span>{msg.sender}</span>
                        <span className="text-[10px] text-slate-500 font-normal">in {msg.chatName}</span>
                      </h4>
                      <span className="text-[10px] text-slate-500">{msg.date} • {msg.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onJumpToChat(msg.chatName)}
                      className="flex items-center space-x-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 text-xs font-bold rounded-lg transition border border-amber-500/20"
                    >
                      <span>Go to Chat</span>
                      <FaArrowRight className="text-[10px]" />
                    </button>
                    <button
                      onClick={() => handleUnstar(msg.id)}
                      title="Unstar Message"
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-medium">
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default React.memo(StarredPage);
