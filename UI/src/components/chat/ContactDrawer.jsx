import React, { useState } from 'react';
import { FaTimes, FaPhone, FaVideo, FaBell, FaBan, FaTrash, FaShieldAlt, FaEnvelope } from 'react-icons/fa';
import ConfirmModal from '../common/ConfirmModal';

const ContactDrawer = ({ contact, isOpen, onClose }) => {
  const [confirmConfig, setConfirmConfig] = useState(null);

  if (!isOpen || !contact) return null;

  return (
    <div className="w-72 lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none shrink-0 z-10 transition-all duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">Contact Info</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
          <FaTimes />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Contact Photo & Name */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <img
              src={contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.name)}`}
              alt={contact.name}
              className="w-24 h-24 rounded-full border-2 border-emerald-500/50 p-1 object-cover shadow-xl"
            />
            {contact.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">{contact.name}</h2>
            <p className="text-xs text-slate-400 font-mono">{contact.email}</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition">
            <FaPhone className="text-emerald-400 text-base mb-1.5" />
            <span>Audio Call</span>
          </button>
          <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition">
            <FaVideo className="text-blue-400 text-base mb-1.5" />
            <span>Video Call</span>
          </button>
        </div>

        {/* User Details */}
        <div className="space-y-4 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block mb-1 uppercase text-[10px] tracking-wider">About / Status</span>
            <p className="text-slate-300 font-medium leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60">
              {contact.status || 'Available on ChatApp Pro'}
            </p>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <FaEnvelope className="text-slate-400 text-sm shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-300">
            <FaShieldAlt className="text-emerald-400 text-sm shrink-0" />
            <span>End-to-End Encrypted Session</span>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 text-xs text-slate-300 font-medium transition">
            <div className="flex items-center space-x-3">
              <FaBell className="text-slate-400 text-sm" />
              <span>Mute Notifications</span>
            </div>
            <input type="checkbox" className="accent-emerald-500 rounded cursor-pointer" />
          </button>

          <button 
            onClick={() => setConfirmConfig({
              title: 'Block Contact',
              message: `Are you sure you want to block ${contact.name}? They will no longer be able to message or call you.`,
              confirmText: 'Block User',
              onConfirm: () => alert(`${contact.name} has been blocked.`)
            })} 
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition"
          >
            <FaBan className="text-sm" />
            <span>Block User</span>
          </button>

          <button 
            onClick={() => setConfirmConfig({
              title: 'Clear Chat History',
              message: `Are you sure you want to clear chat history with ${contact.name}? This will clear your local view.`,
              confirmText: 'Clear Chat',
              onConfirm: () => alert('Chat history cleared.')
            })} 
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition"
          >
            <FaTrash className="text-sm" />
            <span>Clear Chat History</span>
          </button>
        </div>

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

export default ContactDrawer;
