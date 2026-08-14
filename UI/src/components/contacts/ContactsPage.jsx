import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FaSearch, FaUserPlus, FaComment, FaPhone, FaVideo, FaEllipsisV, FaCircle, FaUserFriends } from 'react-icons/fa';
import { apiRequest } from '../../api/client';

const ContactsPage = () => {
  const { onStartChat, onOpenNewChat } = useOutletContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest(`/users/search?q=${encodeURIComponent(searchTerm)}`);
        if (data && data.users) {
          const formatted = data.users.map((u) => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`,
            status: u.status || 'Hey there! I am using ChatApp.',
            isOnline: true
          }));
          setContacts(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [searchTerm]);

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Registered Contacts</h2>
          <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
            {contacts.length} Total
          </span>
        </div>

        <button
          onClick={onOpenNewChat}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
        >
          <FaUserPlus />
          <span>Find Users</span>
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
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm animate-pulse">
            Loading registered users...
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-800 rounded-2xl text-center flex flex-col items-center justify-center space-y-3">
            <FaUserFriends className="text-4xl text-slate-600" />
            <h3 className="text-base font-bold text-white">No Users Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              No registered members match your search criteria. Invite your friends to register and chat!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contacts.map((contact) => (
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
                      <p className="text-xs text-slate-400 truncate max-w-[150px]">{contact.email}</p>
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
                    <FaCircle className="text-[8px] animate-pulse" />
                    <span>Registered User</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onStartChat(contact)}
                      title="Send Message"
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg text-xs font-bold transition border border-emerald-500/20 flex items-center space-x-1"
                    >
                      <FaComment />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ContactsPage;
