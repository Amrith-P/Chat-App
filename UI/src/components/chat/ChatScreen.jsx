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

const ChatScreen = () => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers, emitSendMessage, emitTyping } = useSocket();

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts' | 'starred' | 'settings'
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});

  // Mobile View Toggle ('sidebar' | 'chat')
  const [mobileView, setMobileView] = useState('sidebar');

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch Real Conversations from Database Backend
  const fetchDbConversations = async () => {
    try {
      const data = await apiRequest('/chats');
      if (data && data.chats) {
        const formatted = data.chats.map((c) => ({
          id: c.id,
          name: c.name || c.recipientName || 'User',
          email: c.email || c.recipientEmail || '',
          avatar: c.avatar || c.recipientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name || 'User')}`,
          recipientId: c.contactId || c.recipientId,
          lastMessage: c.lastMessage || 'No messages yet. Say hi!',
          time: c.time || (c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New'),
          unreadCount: c.unreadCount || 0,
          isOnline: onlineUsers.has(c.contactId || c.recipientId),
          status: c.status || 'Available'
        }));

        setConversations(formatted);
      }
    } catch (err) {
      console.log('Error fetching backend conversations:', err.message);
    }
  };

  useEffect(() => {
    fetchDbConversations();
  }, [user]);

  // Fetch Message History for Active Database Chat
  useEffect(() => {
    if (!activeChatId) return;

    const fetchMessages = async () => {
      try {
        const data = await apiRequest(`/messages/${activeChatId}`);
        if (data && data.messages) {
          const formattedMsgs = data.messages.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            isMe: m.senderId === user?.id,
            text: m.content || m.text,
            time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          setMessagesMap((prev) => ({
            ...prev,
            [activeChatId]: formattedMsgs
          }));
        }
      } catch (err) {
        console.log('Failed to fetch backend message history for chat:', activeChatId);
      }
    };

    fetchMessages();
  }, [activeChatId, user]);

  // Join active conversation room on Socket.IO
  useEffect(() => {
    if (socket && activeChatId) {
      socket.emit('join_chat', { chatId: activeChatId, conversationId: activeChatId });
    }
  }, [socket, activeChatId]);

  // Listen to Real-Time Socket.IO Incoming Messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      const isMyMessage = msg.senderId === user?.id;
      // Sender already appended their message locally; ignore duplicate broadcast
      if (isMyMessage) return;

      const chatKey = msg.conversationId || msg.chatId;
      const msgContent = msg.content || msg.text || '';

      // Play audio notification chime for incoming messages from recipient
      try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
        } catch (e) {}

      const formattedMsg = {
        id: msg.id || Date.now(),
        senderId: msg.senderId,
        isMe: isMyMessage,
        text: msgContent,
        time: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Append message to active messages map
      if (chatKey) {
        setMessagesMap((prev) => {
          const existing = prev[chatKey] || [];
          if (existing.some((m) => m.id === formattedMsg.id)) {
            return prev;
          }
          return {
            ...prev,
            [chatKey]: [...existing, formattedMsg]
          };
        });

        setConversations((prev) => {
          const exists = prev.some((c) => String(c.id) === String(chatKey));
          if (!exists) {
            // Re-fetch conversations to include new room
            fetchDbConversations();
            return prev;
          }
          return prev.map((c) =>
            String(c.id) === String(chatKey)
              ? {
                  ...c,
                  lastMessage: msgContent,
                  time: 'Just now',
                  unreadCount: String(activeChatId) === String(chatKey) ? 0 : (c.unreadCount || 0) + 1,
                  hasUnread: String(activeChatId) !== String(chatKey)
                }
              : c
          );
        });

        if (!activeChatId) {
          setActiveChatId(chatKey);
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, activeChatId, user]);

  const activeChat = activeChatId ? conversations.find((c) => c.id === activeChatId) : null;
  const activeMessages = activeChatId ? (messagesMap[activeChatId] || []) : [];

  // Handle Send Message (Persist to Backend REST + Socket.IO Broadcast)
  const handleSendMessage = async (text) => {
    if (!activeChatId) return;

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
      chatId: activeChatId,
      conversationId: activeChatId,
      recipientId: activeChat?.recipientId || activeChat?.contactId,
      text,
      content: text
    });

    // Persist via REST API
    try {
      await apiRequest('/messages', 'POST', {
        conversationId: activeChatId,
        content: text
      });
    } catch (err) {
      console.error('Failed to persist message via REST:', err.message);
    }
  };

  // Handle starting a 1-on-1 chat from Contacts or Search
  const handleStartChatWithContact = async (contact) => {
    try {
      const recipientId = contact.id || contact.contactId;
      if (recipientId) {
        const res = await apiRequest('/chats', 'POST', { recipientId });
        if (res && (res.chat || res.conversation)) {
          const chatObj = res.chat || res.conversation;
          const convId = chatObj.id;

          await fetchDbConversations();
          setActiveChatId(convId);
          setActiveTab('chats');
          setMobileView('chat');
          return;
        }
      }
    } catch (err) {
      console.log('Failed to create/get chat from backend:', err.message);
    }

    setActiveTab('chats');
    setMobileView('chat');
  };

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="h-screen w-full flex bg-slate-950 text-white font-sans overflow-hidden relative">
      
      {/* 1. Vertical Navigation Dock */}
      <NavDock activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={totalUnreadCount} />

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
                  prev.map((c) => (String(c.id) === String(id) ? { ...c, unreadCount: 0, hasUnread: false } : c))
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
