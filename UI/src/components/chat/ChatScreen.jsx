import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import NavDock from '../layout/NavDock';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ContactDrawer from './ContactDrawer';
import SearchModal from './SearchModal';

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
  const [activeTab, setActiveTab] = useState('chats');
  const [conversations, setConversations] = useState(initialConversations);
  const [activeChatId, setActiveChatId] = useState('chat_1');
  const [messagesMap, setMessagesMap] = useState(initialMessages);
  
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

    // Update conversation last message snippet
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? { ...c, lastMessage: text, time: 'Just now', unreadCount: 0 }
          : c
      )
    );
  };

  // Handle selecting a user from Search Modal
  const handleSelectUserFromSearch = (searchedUser) => {
    const existingIndex = conversations.findIndex((c) => c.email === searchedUser.email);
    
    if (existingIndex !== -1) {
      setActiveChatId(conversations[existingIndex].id);
    } else {
      const newChatId = `chat_${Date.now()}`;
      const newConv = {
        id: newChatId,
        name: searchedUser.fullName,
        email: searchedUser.email,
        avatar: searchedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(searchedUser.fullName)}`,
        lastMessage: 'Started a new conversation',
        time: 'Just now',
        unreadCount: 0,
        isOnline: true,
        status: searchedUser.status || 'Hey there! I am using ChatApp.'
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
            text: `Conversation started with ${searchedUser.fullName}. Say hi! 👋`,
            time: 'Just now'
          }
        ]
      }));
    }
  };

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* 1. Slim Vertical Navigation Dock */}
      <NavDock activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Chat Sidebar Panel */}
      <div className="w-80 lg:w-96 shrink-0 h-full">
        <ChatSidebar
          conversations={conversations}
          activeChatId={activeChatId}
          onSelectChat={(id) => {
            setActiveChatId(id);
            // Clear unread count when opening
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
            );
          }}
          onOpenNewChat={() => setIsSearchOpen(true)}
        />
      </div>

      {/* 3. Main Chat Window */}
      <ChatWindow
        activeChat={activeChat}
        messages={activeMessages}
        onSendMessage={handleSendMessage}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      {/* 4. Slide-Out Contact Detail Drawer */}
      <ContactDrawer
        contact={activeChat}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* 5. User Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleSelectUserFromSearch}
      />

    </div>
  );
};

export default ChatScreen;
