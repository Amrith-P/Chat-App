import React, { useState } from 'react';
import { FaSearch, FaUserPlus, FaComment, FaPhone, FaVideo, FaEllipsisV, FaCircle } from 'react-icons/fa';

const sampleContacts = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    status: 'Design Lead @ ChatApp • Coffee lover ☕',
    isOnline: true
  },
  {
    id: 2,
    name: 'David Chen',
    email: 'david.c@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    status: 'Fullstack Engineer 💻',
    isOnline: true
  },
  {
    id: 3,
    name: 'Emma Watson',
    email: 'emma.w@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    status: 'Product Specialist ✨',
    isOnline: false
  },
  {
    id: 4,
    name: 'Alex Morgan',
    email: 'alex.m@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    status: 'Exploring new tech & AI tools 🚀',
    isOnline: true
  },
  {
    id: 5,
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    status: 'DevOps & Cloud Engineer ☁️',
    isOnline: false
  }
];

const ContactsPage = ({ onStartChat, onOpenNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = sampleContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Contacts</h2>
          <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
            {sampleContacts.length} Total
          </span>
        </div>

        <button
          onClick={onOpenNewChat}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
        >
          <FaUserPlus />
          <span>Add New Contact</span>
        </button>
      </header>

      {/* SEARCH BAR & CONTENT */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Search Input */}
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-500 text-sm" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contacts by name, email, or status..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* CONTACT CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition duration-200 hover:shadow-xl hover:shadow-emerald-500/5 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 group-hover:border-emerald-500/60 transition"
                    />
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">
                      {contact.name}
                    </h3>
                    <p className="text-xs text-slate-400">{contact.email}</p>
                  </div>
                </div>

                <button className="text-slate-500 hover:text-slate-300 p-1">
                  <FaEllipsisV className="text-xs" />
                </button>
              </div>

              {/* Status / Bio */}
              <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 line-clamp-2">
                {contact.status}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  {contact.isOnline ? (
                    <>
                      <FaCircle className="text-[8px] animate-pulse" />
                      <span>Available</span>
                    </>
                  ) : (
                    <span className="text-slate-500">Offline</span>
                  )}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStartChat(contact)}
                    title="Send Message"
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg text-xs font-bold transition border border-emerald-500/20"
                  >
                    <FaComment />
                  </button>
                  <button
                    title="Audio Call"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
                  >
                    <FaPhone />
                  </button>
                  <button
                    title="Video Call"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
                  >
                    <FaVideo />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ContactsPage;
