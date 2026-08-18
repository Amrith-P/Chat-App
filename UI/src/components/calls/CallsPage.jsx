import React, { useState } from 'react';
import { 
  FaPhoneAlt, 
  FaVideo, 
  FaSearch, 
  FaTrash, 
  FaPhone, 
  FaArrowDown, 
  FaArrowUp 
} from 'react-icons/fa';
import { useCall } from '../../context/CallContext';

const CallsPage = () => {
  const { callHistory, clearCallHistory, startCall } = useCall();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = (callHistory || []).filter((log) =>
    (log.contactName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
            <FaPhone className="text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Call History</h2>
            <p className="text-[11px] text-slate-400">Recent voice and video calls</p>
          </div>
        </div>

        {callHistory && callHistory.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your call history?')) {
                clearCallHistory();
              }
            }}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition"
          >
            <FaTrash />
            <span>Clear History</span>
          </button>
        )}
      </header>

      {/* BODY */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6 max-w-4xl">
        
        {/* Search */}
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search call logs by contact name..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* CALL LOGS LIST */}
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 text-2xl mx-auto">
              📞
            </div>
            <p className="text-sm font-medium">No call logs yet.</p>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your voice and video call logs will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isMissed = log.direction === 'missed';
              const isIncoming = log.direction === 'incoming';

              return (
                <div
                  key={log.id}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 transition duration-200 shadow-md flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <img
                      src={log.contactAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(log.contactName || 'User')}`}
                      alt={log.contactName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                    />

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition truncate">
                        {log.contactName}
                      </h4>
                      
                      <div className="flex items-center space-x-2 text-xs mt-0.5">
                        {isMissed ? (
                          <span className="text-red-400 font-semibold flex items-center space-x-1">
                            <FaArrowDown className="text-[10px] transform rotate-45" />
                            <span>Missed Call</span>
                          </span>
                        ) : isIncoming ? (
                          <span className="text-emerald-400 font-medium flex items-center space-x-1">
                            <FaArrowDown className="text-[10px] transform rotate-45" />
                            <span>Incoming Call</span>
                          </span>
                        ) : (
                          <span className="text-blue-400 font-medium flex items-center space-x-1">
                            <FaArrowUp className="text-[10px] transform -rotate-45" />
                            <span>Outgoing Call</span>
                          </span>
                        )}

                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{log.date || 'Today'} at {log.time}</span>
                        {log.duration && log.duration !== 'Missed' && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-mono">{log.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Re-dial Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => startCall({ id: log.contactId, name: log.contactName, avatar: log.contactAvatar }, 'video')}
                      className="p-2.5 bg-slate-800 hover:bg-emerald-500 text-slate-300 hover:text-slate-950 rounded-xl transition shadow-sm"
                      title="Start Video Call"
                    >
                      <FaVideo className="text-sm" />
                    </button>
                    <button
                      onClick={() => startCall({ id: log.contactId, name: log.contactName, avatar: log.contactAvatar }, 'audio')}
                      className="p-2.5 bg-slate-800 hover:bg-blue-500 text-slate-300 hover:text-white rounded-xl transition shadow-sm"
                      title="Start Voice Call"
                    >
                      <FaPhone className="text-sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default React.memo(CallsPage);
