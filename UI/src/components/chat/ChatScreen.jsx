import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NavDock from '../layout/NavDock';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ContactDrawer from './ContactDrawer';
import SearchModal from './SearchModal';
import ContactsPage from '../contacts/ContactsPage';
import StarredPage from '../starred/StarredPage';

const initialConversations = [
  {
    id: 'chat_1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    lastMessage: "Sounds great! Let's touch base tomorrow morning 🚀",
    time: '10:45 AM',
    unreadCount: 2,
    isOnline: true,
    status: 'Design Lead @ ChatApp • Coffee lover ☕'
  },
  {
    id: 'chat_2',
    name: 'David Chen',
    email: 'david.c@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    lastMessage: 'Did you check the new backend API endpoints?',
    time: '09:20 AM',
    unreadCount: 0,
    isOnline: true,
    status: 'Fullstack Engineer 💻'
  },
  {
    id: 'chat_3',
    name: 'Emma Watson',
    email: 'emma.w@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    lastMessage: 'Thanks for sending over the documentation!',
    time: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    status: 'Product Specialist ✨'
  }
];

const initialMessages = {
  chat_1: [
    { id: 1, senderId: 'sarah', isMe: false, text: 'Hey there! How is the project coming along?', time: '10:40 AM' },
    { id: 2, senderId: 'me', isMe: true, text: 'Hey Sarah! We just finished upgrading the authentication and chat interface!', time: '10:42 AM' },
    { id: 3, senderId: 'sarah', isMe: false, text: "Sounds great! Let's touch base tomorrow morning 🚀", time: '10:45 AM' }
  ],
  chat_2: [
    { id: 1, senderId: 'david', isMe: false, text: 'Hi! Quick question about SQLite configuration.', time: '09:15 AM' },
    { id: 2, senderId: 'me', isMe: true, text: 'Sure David, what do you need?', time: '09:18 AM' },
    { id: 3, senderId: 'david', isMe: false, text: 'Did you check the new backend API endpoints?', time: '09:20 AM' }
  ],
  chat_3: [
    { id: 1, senderId: 'emma', isMe: false, text: 'Thanks for sending over the documentation!', time: 'Yesterday' }
  ]
};

const ChatScreen = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts' | 'starred' | 'settings'
  const [conversations, setConversations] = useState(initialConversations);
  const [activeChatId, setActiveChatId] = useState('chat_1');
  const [messagesMap, setMessagesMap] = useState(initialMessages);
  
  // Mobile View Toggle ('sidebar' | 'chat')
  const [mobileView, setMobileView] = useState('sidebar');

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];
  const activeMessages = messagesMap[activeChatId] || [];

  // Handle Send Message
  const handleSendMessage = (text) => {
    const newMsg = {
      id: Date.now(),
      senderId: 'me',
      isMe: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg]
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: text, time: 'Just now', unreadCount: 0 }
          : c
      )
    );
  };

  // Handle starting chat from Contacts or Search
  const handleStartChatWithContact = (contact) => {
    const existingIndex = conversations.findIndex((c) => c.name === contact.name || c.email === contact.email);
    
    if (existingIndex !== -1) {
      setActiveChatId(conversations[existingIndex].id);
    } else {
      const newChatId = `chat_${Date.now()}`;
      const newConv = {
        id: newChatId,
        name: contact.fullName || contact.name,
        email: contact.email,
        avatar: contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.name)}`,
        lastMessage: 'Started a new conversation',
        time: 'Just now',
        unreadCount: 0,
        isOnline: true,
        status: contact.status || 'Hey there! I am using ChatApp.'
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveChatId(newChatId);
      setMessagesMap((prev) => ({
        ...prev,
        [newChatId]: [
          {
            id: Date.now(),
            senderId: 'system',
            isMe: false,
            text: `Conversation started with ${contact.name || contact.fullName}. Say hi! 👋`,
            time: 'Just now'
          }
        ]
      }));
    }

    setActiveTab('chats');
    setMobileView('chat');
  };

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white font-sans overflow-hidden relative">
      
      {/* 1. Vertical Navigation Dock */}
      <NavDock activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Content Area depending on activeTab */}
      {activeTab === 'chats' && (
        <div className="flex-1 flex h-full overflow-hidden">
          {/* Chat Sidebar */}
          <div className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
            mobileView === 'sidebar' ? 'block' : 'hidden md:block'
          }`}>
            <ChatSidebar
              conversations={conversations}
              activeChatId={activeChatId}
              onSelectChat={(id) => {
                setActiveChatId(id);
                setMobileView('chat');
                setConversations((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
                );
              }}
              onOpenNewChat={() => setIsSearchOpen(true)}
            />
          </div>

          {/* Active Chat Window */}
          <div className={`flex-1 h-full ${
            mobileView === 'chat' ? 'block' : 'hidden md:block'
          }`}>
            <ChatWindow
              activeChat={activeChat}
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
              onBackToSidebar={() => setMobileView('sidebar')}
            />
          </div>

          {/* Slide-Out Contact Detail Drawer */}
          <div className={`fixed md:relative inset-y-0 right-0 z-50 md:z-auto transition-transform duration-300 transform ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}>
            <ContactDrawer
              contact={activeChat}
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Contacts Tab View */}
      {activeTab === 'contacts' && (
        <ContactsPage
          onStartChat={handleStartChatWithContact}
          onOpenNewChat={() => setIsSearchOpen(true)}
        />
      )}

      {/* Starred Messages Tab View */}
      {activeTab === 'starred' && (
        <StarredPage
          onJumpToChat={(contactName) => {
            const found = conversations.find((c) => c.name.toLowerCase().includes(contactName.toLowerCase()));
            if (found) setActiveChatId(found.id);
            setActiveTab('chats');
            setMobileView('chat');
          }}
        />
      )}

      {/* Settings Tab View */}
      {activeTab === 'settings' && (
        <div className="flex-1 h-full bg-slate-950 p-8 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-4">
            ⚙️
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
          <p className="text-slate-400 text-sm max-w-sm">
            Manage your profile details, notification preferences, dark theme customization, and security options.
          </p>
        </div>
      )}

      {/* 3. User Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleStartChatWithContact}
      />

    </div>
  );
};

export default ChatScreen;
