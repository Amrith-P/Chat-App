import React, { useState } from 'react';
import { 
  FaBell, 
  FaCheck, 
  FaTimes, 
  FaPaperPlane, 
  FaUserClock, 
  FaClock 
} from 'react-icons/fa';
import ConfirmModal from '../common/ConfirmModal';

const RequestsTab = ({ 
  incomingRequests = [], 
  outgoingRequests = [], 
  loading, 
  onAccept, 
  onReject, 
  onCancel 
}) => {
  const [subTab, setSubTab] = useState('incoming'); // 'incoming' | 'outgoing'
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleAction = async (actionFn, requestId) => {
    setActionLoadingId(requestId);
    try {
      await actionFn(requestId);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full h-full bg-slate-900/95 flex flex-col select-none overflow-hidden border-r border-slate-800">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <FaBell className="text-amber-400 text-lg" />
          <h2 className="text-xl font-bold text-white tracking-tight">Friend Requests</h2>
          {incomingRequests.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs rounded-full">
              {incomingRequests.length}
            </span>
          )}
        </div>

        {/* Subtab Selector */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setSubTab('incoming')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              subTab === 'incoming'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FaBell className="text-[11px]" />
            <span>Incoming</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('outgoing')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1.5 ${
              subTab === 'outgoing'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FaPaperPlane className="text-[11px]" />
            <span>Outgoing</span>
            {outgoingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 font-bold text-[10px] rounded-full">
                {outgoingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Request List Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Loading requests...
          </div>
        ) : subTab === 'incoming' ? (
          /* INCOMING REQUESTS */
          incomingRequests.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 text-2xl mx-auto">
                🔔
              </div>
              <h4 className="text-sm font-bold text-slate-200">No incoming friend requests</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                When someone sends you a friend request, it will show up here in real time.
              </p>
            </div>
          ) : (
            incomingRequests.map((reqItem) => {
              const isLoading = actionLoadingId === reqItem.id;

              return (
                <div
                  key={reqItem.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <img
                      src={reqItem.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(reqItem.fullName || 'User')}`}
                      alt={reqItem.fullName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {reqItem.fullName}
                      </h3>
                      <p className="text-xs text-slate-400 truncate font-mono">{reqItem.email}</p>
                      <p className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <FaClock />
                        <span>{new Date(reqItem.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  {/* Accept / Decline Buttons */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(onAccept, reqItem.id)}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <FaCheck />
                      <span>{isLoading ? 'Accepting...' : 'Accept'}</span>
                    </button>

                    <button
                      disabled={isLoading}
                      onClick={() => handleAction(onReject, reqItem.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center space-x-1 border border-slate-700/60 disabled:opacity-50"
                    >
                      <FaTimes />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* OUTGOING REQUESTS */
          outgoingRequests.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 text-2xl mx-auto">
                📤
              </div>
              <h4 className="text-sm font-bold text-slate-200">No outgoing requests</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Friend requests you send to other users will appear here until accepted.
              </p>
            </div>
          ) : (
            outgoingRequests.map((reqItem) => {
              const isLoading = actionLoadingId === reqItem.id;

              return (
                <div
                  key={reqItem.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <img
                      src={reqItem.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(reqItem.fullName || 'User')}`}
                      alt={reqItem.fullName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-700 bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {reqItem.fullName}
                        </h3>
                        <span className="px-2 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-md">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate font-mono">{reqItem.email}</p>
                    </div>
                  </div>

                  <button
                    disabled={isLoading}
                    onClick={() => setConfirmConfig({
                      title: 'Cancel Friend Request',
                      message: `Cancel friend request to ${reqItem.fullName}?`,
                      confirmText: 'Cancel Request',
                      onConfirm: () => handleAction(onCancel, reqItem.id)
                    })}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold rounded-xl transition border border-slate-700/60 disabled:opacity-50"
                  >
                    {isLoading ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              );
            })
          )
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

export default RequestsTab;
