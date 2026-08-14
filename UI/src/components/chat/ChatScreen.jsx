import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { apiRequest } from '../../api/client';
import { sendSystemNotification } from '../../utils/notification';
import NavDock from '../layout/NavDock';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ContactDrawer from './ContactDrawer';
import SearchModal from './SearchModal';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  // Support SQLite format by replacing space with 'T' and adding 'Z' for UTC if not present
  let iso = String(dateStr);
  if (!iso.includes('T')) iso = iso.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d) ? new Date() : d;
};

const ChatScreen = () => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsers, emitSendMessage, emitTyping } = useSocket();

  const location = useLocation();
  const navigate = useNavigate();
  const isChatsRoute = location.pathname.includes('/app/chats');
  
  // Extract dynamic chatId from /app/chats/:chatId
  const urlChatId = isChatsRoute ? location.pathname.split('/app/chats/')[1] : null;

  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(urlChatId || null);

  useEffect(() => {
    if (urlChatId && String(urlChatId) !== String(activeChatId)) {
      setActiveChatId(urlChatId);
    } else if (!urlChatId && activeChatId) {
      setActiveChatId(null);
    }
  }, [urlChatId]);
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
        const formatted = data.chats.map((c) => {
          const rawTime = c.lastMessageTime || c.time;
          const isSpecial = !rawTime || rawTime === 'Just now' || rawTime === 'New';
          const displayTime = isSpecial ? (rawTime || 'New') : parseDate(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: c.id,
            name: c.name || c.recipientName || 'User',
            email: c.email || c.recipientEmail || '',
            avatar: c.avatar || c.recipientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name || 'User')}`,
            recipientId: c.contactId || c.recipientId,
            lastMessage: c.lastMessage || 'No messages yet. Say hi!',
            time: displayTime,
            timestamp: c.lastMessageTime ? parseDate(c.lastMessageTime).getTime() : 0,
            unreadCount: c.unreadCount || 0,
            isOnline: Boolean(c.isOnline) || onlineUsers.has(Number(c.contactId || c.recipientId)) || onlineUsers.has(String(c.contactId || c.recipientId)),
            status: c.status || 'Available'
          };
        }).sort((a, b) => b.timestamp - a.timestamp);

        setConversations(formatted);
      }
    } catch (err) {
      console.log('Error fetching backend conversations:', err.message);
    }
  };

  useEffect(() => {
    fetchDbConversations();
  }, [user]);

  // Dynamically update isOnline status for conversations when onlineUsers set changes
  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => {
        const contactId = c.contactId || c.recipientId;
        const isOnline = onlineUsers.has(Number(contactId)) || onlineUsers.has(String(contactId));
        return { ...c, isOnline };
      })
    );
  }, [onlineUsers]);

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
            text: m.text,
            replyToId: m.replyToId,
            isForwarded: Boolean(m.isForwarded),
            isEdited: Boolean(m.isEdited),
            isDeleted: Boolean(m.isDeleted),
            readAt: m.readAt,
            reactions: m.reactions || [],
            time: parseDate(m.createdAt || m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: parseDate(m.createdAt || m.time).toLocaleDateString()
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

  // Audio sound effect helper (capped strictly to < 0.25 seconds)
  const playChimeSound = (type = 'send') => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';

      if (type === 'send') {
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }

      setTimeout(() => {
        try { ctx.close(); } catch (err) {}
      }, 250);
    } catch (e) {}
  };

  // Listen to Real-Time Socket.IO Incoming Messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      const isMyMessage = msg.senderId === user?.id;
      if (isMyMessage) return;

      const chatKey = msg.conversationId || msg.chatId;
      const msgContent = msg.content || msg.text || '';

      // Play short audio chime & trigger desktop notification for incoming messages
      playChimeSound('receive');
      sendSystemNotification(`New message from ${msg.senderName || 'ChatApp User'}`, {
        body: msgContent || 'Sent a new message'
      });

      const formattedMsg = {
        id: msg.id || Date.now(),
        senderId: msg.senderId,
        isMe: isMyMessage,
        text: msgContent,
        replyToId: msg.replyToId,
        isForwarded: msg.isForwarded,
        isEdited: msg.isEdited,
        isDeleted: msg.isDeleted,
        readAt: msg.readAt,
        reactions: msg.reactions || [],
        time: parseDate(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: parseDate(msg.createdAt).toLocaleDateString()
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
            fetchDbConversations();
            return prev;
          }
          return prev.map((c) =>
            String(c.id) === String(chatKey)
              ? {
                  ...c,
                  lastMessage: msgContent,
                  time: 'Just now',
                  timestamp: Date.now(),
                  unreadCount: String(activeChatId) === String(chatKey) ? 0 : (c.unreadCount || 0) + 1,
                  hasUnread: String(activeChatId) !== String(chatKey)
                }
              : c
          ).sort((a, b) => b.timestamp - a.timestamp);
        });

        if (!activeChatId) setActiveChatId(chatKey);
        
        // Mark as read immediately if chat is open
        if (String(activeChatId) === String(chatKey) && socket) {
          socket.emit('mark_read', { messageIds: [formattedMsg.id], chatId: chatKey });
        }
      }
    };

    const handleMessagesRead = ({ messageIds, chatId, readAt }) => {
      setMessagesMap((prev) => {
        const existing = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: existing.map(m => messageIds.includes(m.id) ? { ...m, readAt } : m)
        };
      });
    };

    const handleReactionAdded = ({ chatId, reaction }) => {
      setMessagesMap((prev) => {
        const existing = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: existing.map(m => m.id === reaction.messageId ? { ...m, reactions: [...(m.reactions || []), reaction] } : m)
        };
      });
    };

    const handleMessageEdited = ({ messageId, chatId, newText }) => {
      setMessagesMap((prev) => {
        const existing = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: existing.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m)
        };
      });
    };

    const handleMessageDeleted = ({ messageId, chatId }) => {
      setMessagesMap((prev) => {
        const existing = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: existing.map(m => m.id === messageId ? { ...m, text: '🚫 This message was deleted', isDeleted: true } : m)
        };
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_reaction_added', handleReactionAdded);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_reaction_added', handleReactionAdded);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, activeChatId, user]);

  const activeChat = useMemo(() => {
    return activeChatId ? conversations.find((c) => String(c.id) === String(activeChatId)) : null;
  }, [activeChatId, conversations]);

  const activeMessages = useMemo(() => {
    return activeChatId ? (messagesMap[activeChatId] || []) : [];
  }, [activeChatId, messagesMap]);

  // Handle Send Message (Persist to Backend REST + Socket.IO Broadcast)
  const handleSendMessage = async (text, options = {}) => {
    if (!activeChatId) return;

    playChimeSound('send');

    const newMsg = {
      id: Date.now(),
      senderId: user?.id || 'me',
      isMe: true,
      text,
      replyToId: options.replyToId,
      isForwarded: options.isForwarded,
      isEdited: false,
      isDeleted: false,
      readAt: null,
      reactions: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    };

    // Update local state instantly for zero-latency UX
    setMessagesMap((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg]
    }));

    setConversations((prev) =>
      prev.map((c) =>
        String(c.id) === String(activeChatId)
          ? { ...c, lastMessage: text, time: 'Just now', timestamp: Date.now(), unreadCount: 0 }
          : c
      ).sort((a, b) => b.timestamp - a.timestamp)
    );

    // 1. Emit via Real-Time Socket.IO (Socket backend handles DB persistence & broadcast)
    if (socket && isConnected) {
      emitSendMessage({
        chatId: activeChatId,
        conversationId: activeChatId,
        recipientId: activeChat?.recipientId || activeChat?.contactId,
        text,
        content: text,
        replyToId: options.replyToId,
        isForwarded: options.isForwarded
      });
    } else {
      // 2. Fallback to REST API ONLY if real-time socket engine is disconnected
      try {
        await apiRequest('/messages', 'POST', {
          chatId: activeChatId,
          conversationId: activeChatId,
          content: text,
          replyToId: options.replyToId || null,
          isForwarded: Boolean(options.isForwarded)
        });
      } catch (err) {
        console.error('Failed to persist message via REST:', err.message);
      }
    }
  };

  const handleMessageAction = (action, payload) => {
    if (!socket || !activeChatId) return;
    const recipientId = activeChat?.recipientId || activeChat?.contactId;

    if (action === 'delete') {
      socket.emit('delete_message', { messageId: payload.messageId, chatId: activeChatId, recipientId });
    } else if (action === 'edit') {
      socket.emit('edit_message', { messageId: payload.messageId, newText: payload.newText, chatId: activeChatId, recipientId });
    } else if (action === 'react') {
      socket.emit('add_reaction', { messageId: payload.messageId, emoji: payload.emoji, chatId: activeChatId, recipientId });
    }
  };

  // Handle starting a 1-on-1 chat from Contacts or Search
  const handleStartChatWithContact = async (contact) => {
    setIsSearchOpen(false);
    setIsDrawerOpen(false); // Also close drawer just in case

    try {
      const recipientId = contact.id || contact.contactId;
      if (recipientId) {
        const res = await apiRequest('/chats', 'POST', { recipientId });
        if (res && (res.chat || res.conversation)) {
          const chatObj = res.chat || res.conversation;
          const convId = chatObj.id;

          await fetchDbConversations();
          navigate(`/app/chats/${convId}`);
          setMobileView('chat');
          return;
        }
      }
    } catch (err) {
      console.log('Failed to create/get chat from backend:', err.message);
    }

    navigate('/app/chats');
    setMobileView('chat');
  };

  // Handle deleting a conversation
  const handleDeleteChat = async (chatId) => {
    try {
      await apiRequest(`/chats/${chatId}`, 'DELETE');
      setConversations((prev) => prev.filter((c) => String(c.id) !== String(chatId)));
      setMessagesMap((prev) => {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });

      if (String(activeChatId) === String(chatId)) {
        navigate('/app/chats');
        setMobileView('sidebar');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err.message);
    }
  };

  const handleSelectChat = useCallback((id) => {
    navigate(`/app/chats/${id}`);
    setMobileView('chat');
    setConversations((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, unreadCount: 0, hasUnread: false } : c))
    );
  }, [navigate]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <div className="h-[100dvh] w-full flex bg-slate-950 text-white font-sans overflow-hidden fixed inset-0">
      
      {/* Real-Time Disconnecting Banner */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500/90 text-slate-950 text-[11px] font-bold text-center py-1 flex items-center justify-center space-x-2 shadow-lg">
          <span className="animate-pulse">⚡ Connection lost. Reconnecting to real-time engine...</span>
        </div>
      )}

      {/* Navigation Dock (Mobile Nav hidden when typing/active chat open) */}
      <NavDock unreadCount={totalUnreadCount} hideMobileNav={mobileView === 'chat'} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isChatsRoute ? (
          <>
            {/* Chats Tab View */}
            {/* Chat List Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-300 ${
              mobileView === 'sidebar' ? 'block' : 'hidden md:flex'
            }`}>
            <ChatSidebar
              conversations={conversations}
              activeChatId={activeChatId}
              onSelectChat={handleSelectChat}
              onOpenNewChat={() => setIsSearchOpen(true)}
              onDeleteChat={handleDeleteChat}
              onStartChatWithContact={handleStartChatWithContact}
            />
          </div>

          {/* Active Chat Window */}
          <div className={`flex-1 h-full min-w-0 overflow-hidden ${
            mobileView === 'chat' ? 'block' : 'hidden md:block'
          }`}>
            <ChatWindow
              activeChat={activeChat}
              messages={activeMessages}
              onSendMessage={handleSendMessage}
              onMessageAction={handleMessageAction}
              onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
              onBackToSidebar={() => {
                navigate('/app/chats');
                setMobileView('sidebar');
              }}
              onDeleteChat={handleDeleteChat}
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
          </>
        ) : (
          <Outlet context={{
            onStartChat: handleStartChatWithContact,
            onOpenNewChat: () => setIsSearchOpen(true),
            conversations,
            onJumpToChat: (contactName) => {
              const found = conversations.find((c) => c.name.toLowerCase().includes(contactName.toLowerCase()));
              if (found) {
                navigate(`/app/chats/${found.id}`);
                setMobileView('chat');
              } else {
                navigate('/app/chats');
              }
            }
          }} />
        )}
      </div>

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={handleStartChatWithContact}
      />

    </div>
  );
};

export default ChatScreen;
