import React from 'react';
import { FaTimes, FaPhone, FaVideo, FaBell, FaBan, FaTrash, FaShieldAlt, FaEnvelope } from 'react-icons/fa';

const ContactDrawer = ({ contact, isOpen, onClose }) => {
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
              className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/40 shadow-xl"
            />
            {contact.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-slate-900" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{contact.name}</h2>
            <p className="text-xs text-slate-400 flex items-center justify-center space-x-1 mt-0.5">
              <FaEnvelope className="text-[10px]" />
              <span>{contact.email || `${contact.name.toLowerCase().replace(/\s+/g, '')}@example.com`}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-white transition">
            <FaPhone className="text-emerald-400" />
            <span>Audio Call</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-xs font-semibold text-white transition">
            <FaVideo className="text-teal-400" />
            <span>Video Call</span>
          </button>
        </div>

        {/* Bio / Status */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status / About</span>
          <p className="text-xs text-slate-300 font-medium">
            {contact.status || 'Available for messaging on ChatApp Pro ✨'}
          </p>
        </div>

        {/* Shared Media Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Shared Media</span>
            <span className="text-emerald-400 hover:underline cursor-pointer font-semibold">View All</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-700/50">IMG_1.jpg</div>
            <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-700/50">DOC_2.pdf</div>
            <div className="h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500 font-bold border border-slate-700/50">+4 More</div>
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

          <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition">
            <FaBan className="text-sm" />
            <span>Block User</span>
          </button>

          <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition">
            <FaTrash className="text-sm" />
            <span>Clear Chat History</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ContactDrawer;
