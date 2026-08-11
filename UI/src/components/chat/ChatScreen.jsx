import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiRequest } from '../../api/client';
import NavDock from '../layout/NavDock';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ContactDrawer from './ContactDrawer';
import SearchModal from './SearchModal';
import ContactsPage from '../contacts/ContactsPage';
import StarredPage from '../starred/StarredPage';
import SettingsPage from '../settings/SettingsPage';

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
  const { socket, isConnected, onlineUsers, emitSendMessage, emitTyping } = useSocket();

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts' | 'starred' | 'settings'
  const [conversations, setConversations] = useState(initialConversations);
  const [activeChatId, setActiveChatId] = useState('chat_1');
  const [messagesMap, setMessagesMap] = useState(initialMessages);

  // Mobile View Toggle ('sidebar' | 'chat')
  const [mobileView, setMobileView] = useState('sidebar');

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch Real Conversations from SQLite Backend
  useEffect(() => {
    const fetchDbConversations = async () => {
      try {
        const data = await apiRequest('/chats');
        if (data && data.chats && data.chats.length > 0) {
          const formatted = data.chats.map((c) => ({
            id: c.id,
            name: c.recipientName,
            email: c.recipientEmail,
            avatar: c.recipientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.recipientName)}`,
            recipientId: c.recipientId,
            lastMessage: c.lastMessage || 'No messages yet',
            time: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New',
            unreadCount: 0,
            isOnline: onlineUsers.has(c.recipientId),
            status: c.recipientStatus || 'Available'
          }));

          setConversations(formatted);
          setActiveChatId(formatted[0].id);
        }
      } catch (err) {
        console.log('Using default demo conversations (fallback or unauthenticated DB query)');
      }
    };

    fetchDbConversations();
  }, [user]);

  // Fetch Message History for Active Database Chat
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      // If it's a numeric database chat ID
      if (typeof activeChatId === 'number' || !activeChatId.toString().startsWith('chat_')) {
        try {
          const data = await apiRequest(`/messages/${activeChatId}`);
          if (data && data.messages) {
            const formattedMsgs = data.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              isMe: m.senderId === user?.id,
              text: m.content,
              time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));

            setMessagesMap((prev) => ({
              ...prev,
              [activeChatId]: formattedMsgs
            }));
          }
        } catch (err) {
          console.log('Failed to fetch backend message history for chat:', activeChatId);
        }
      }
    };

    fetchMessages();
  }, [activeChatId, user]);

  // Listen to Real-Time Socket.IO Incoming Messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      const chatKey = msg.conversationId || activeChatId;
      const formattedMsg = {
        id: msg.id || Date.now(),
        senderId: msg.senderId,
        isMe: msg.senderId === user?.id,
        text: msg.content,
        time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessagesMap((prev) => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), formattedMsg]
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatKey
            ? {
                ...c,
                lastMessage: msg.content,
                time: 'Just now',
                unreadCount: activeChatId === chatKey ? 0 : (c.unreadCount || 0) + 1
              }
            : c
        )
      );
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, activeChatId, user]);

  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];
  const activeMessages = messagesMap[activeChatId] || [];

  // Handle Send Message (Persist to Backend REST + Socket.IO Broadcast)
  const handleSendMessage = async (text) => {
    const newMsg = {
      id: Date.now(),
      senderId: user?.id || 'me',
      isMe: true,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update local state instantly for zero-latency UX
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

    // Emit Real-Time Socket.IO event
    emitSendMessage({
      conversationId: activeChatId,
      recipientId: activeChat?.recipientId,
      content: text
    });

    // Also persist via REST API if numeric DB chat ID
    if (typeof activeChatId === 'number' || !activeChatId.toString().startsWith('chat_')) {
      try {
        await apiRequest('/messages', 'POST', {
          conversationId: activeChatId,
          content: text
        });
      } catch (err) {
        console.error('Failed to persist message via REST:', err);
      }
    }
  };

  // Handle starting a 1-on-1 chat from Contacts or Search
  const handleStartChatWithContact = async (contact) => {
    try {
      // Create or fetch direct conversation from SQLite backend if real user
      if (contact.id) {
        const res = await apiRequest('/chats', 'POST', { recipientId: contact.id });
        if (res && res.conversation) {
          const convId = res.conversation.id;
          const existingIndex = conversations.findIndex((c) => c.id === convId);

          if (existingIndex === -1) {
            const newConv = {
              id: convId,
              name: contact.fullName || contact.name,
              email: contact.email,
              avatar: contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.fullName || contact.name)}`,
              recipientId: contact.id,
              lastMessage: 'Started a new conversation',
              time: 'Just now',
              unreadCount: 0,
              isOnline: onlineUsers.has(contact.id),
              status: contact.status || 'Hey there! I am using ChatApp.'
            };

            setConversations((prev) => [newConv, ...prev]);
          }

          setActiveChatId(convId);
          setActiveTab('chats');
          setMobileView('chat');
          return;
        }
      }
    } catch (err) {
      console.log('Falling back to local state chat creation');
    }

    // Local fallback
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
        <SettingsPage />
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
