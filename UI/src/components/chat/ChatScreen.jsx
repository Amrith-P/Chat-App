import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useSocket } from '../../hooks/socket/useSocket';
import { useSocketEvent } from '../../hooks/socket/useSocketEvent';
import { useChatList } from '../../hooks/chat/useChatList';
import { useChatSelection } from '../../hooks/chat/useChatSelection';
import { useChatActions } from '../../hooks/chat/useChatActions';
import { apiRequest } from '../../api/client';
import { sendSystemNotification } from '../../utils/notification';
import { getOrGenerateUserKeys, importPublicKey, deriveSharedKey, encryptMessage, decryptMessage, getFallbackPeerPublicKey } from '../../utils/e2ee';
import NavDock from '../layout/NavDock';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ContactDrawer from './ContactDrawer';
import SearchModal from './SearchModal';
import CreateGroupModal from './CreateGroupModal';
import { useGroupChat } from '../../hooks/chat/useGroupChat';
import { useFriends } from '../../hooks/social/useFriends';

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  let iso = String(dateStr);
  if (!iso.includes('T')) iso = iso.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d) ? new Date() : d;
};

const ChatScreen = () => {
  const { user } = useAuth();
  const { socket, isConnected, emitSendMessage } = useSocket();
  const { conversations, setConversations, refreshConversations } = useChatList();
  const { 
    activeChatId, 
    setActiveChatId, 
    mobileView, 
    setMobileView, 
    isChatsRoute, 
    selectChat 
  } = useChatSelection(setConversations);

  const [messagesMap, setMessagesMap] = useState({});
  const { deleteChat, clearChat, toggleFavoriteChat } = useChatActions(
    setConversations,
    setMessagesMap,
    activeChatId,
    setMobileView
  );

  // Group Chat & Friends Hooks
  const { createGroup, leaveGroup: leaveGroupApi, deleteGroup: deleteGroupApi } = useGroupChat();
  const { 
    friends, 
    incomingRequests, 
    outgoingRequests, 
    incomingCount, 
    loading: loadingSocial, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    cancelFriendRequest, 
    removeFriend 
  } = useFriends();

  // Active Sidebar Tab State ('chats' | 'friends' | 'requests')
  const [activeTab, setActiveTab] = useState('chats');

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContact, setDrawerContact] = useState(null);

  const handleViewProfile = (targetContact) => {
    if (!targetContact) return;
    setDrawerContact({
      id: targetContact.id || targetContact.contactId,
      contactId: targetContact.id || targetContact.contactId,
      name: targetContact.fullName || targetContact.name || 'User',
      email: targetContact.email || '',
      avatar: targetContact.avatar || '',
      status: targetContact.status || '',
      description: targetContact.description || '',
      isGroup: Boolean(targetContact.isGroup),
      isOnline: Boolean(targetContact.isOnline)
    });
    setIsDrawerOpen(true);
    setIsSearchOpen(false);
  };

  const handleCreateGroup = async (groupData) => {
    const newGroup = await createGroup(groupData);
    if (newGroup && newGroup.id) {
      await refreshConversations();
      selectChat(newGroup.id);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await leaveGroupApi(groupId);
      setIsDrawerOpen(false);
      selectChat('');
      await refreshConversations();
    } catch (err) {
      alert(`Failed to leave group: ${err.message}`);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroupApi(groupId);
      setIsDrawerOpen(false);
      selectChat('');
      await refreshConversations();
    } catch (err) {
      alert(`Failed to delete group: ${err.message}`);
    }
  };

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

  // Ref to hold active AES key for realtime event handlers without stale closures
  const activeAESKeyRef = useRef(null);

  // Listen to Real-Time Socket.IO Incoming Messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = async (msg) => {
      const isMyMessage = msg.senderId === user?.id;
      if (isMyMessage) return;

      const chatKey = msg.conversationId || msg.chatId;
      let msgContent = msg.content || msg.text || '';

      // Decrypt incoming E2EE message payload
      if (typeof msgContent === 'string' && msgContent.startsWith('E2EE_V1::')) {
        let keyToUse = activeAESKeyRef.current;

        if (!keyToUse && user?.id && msg.senderId) {
          try {
            const myKeys = await getOrGenerateUserKeys(user.id);
            const sRes = await apiRequest(`/users/${msg.senderId}`);
            if (sRes?.user?.publicKey && myKeys?.privateKey) {
              const senderPubKey = await importPublicKey(sRes.user.publicKey);
              if (senderPubKey) {
                keyToUse = await deriveSharedKey(myKeys.privateKey, senderPubKey);
              }
            }
          } catch (e) {}
        }

        if (keyToUse) {
          const decrypted = await decryptMessage(msgContent, keyToUse);
          if (decrypted) {
            msgContent = decrypted;
          }
        }
      }

      // Play short audio chime & trigger desktop notification for incoming messages
      playChimeSound('receive');
      sendSystemNotification(`New message from ${msg.senderName || 'Pulse-X User'}`, {
        body: (typeof msgContent === 'string' && msgContent.startsWith('E2EE_V1::')) ? '🔒 Encrypted message' : (msgContent || 'Sent a new message')
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
            refreshConversations();
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
      const targetChatId = chatId || activeChatId;
      if (!targetChatId) return;
      setMessagesMap((prev) => {
        const existing = prev[targetChatId] || [];
        return {
          ...prev,
          [targetChatId]: existing.map((m) =>
            String(m.id) === String(messageId)
              ? { ...m, text: '🚫 This message was deleted', isDeleted: true }
              : m
          )
        };
      });
    };

    const handleMessageSent = (serverMsg) => {
      if (!serverMsg) return;
      const chatKey = serverMsg.chatId || serverMsg.conversationId;
      const tempId = serverMsg.tempId;
      const realId = serverMsg.id;

      if (!chatKey || !realId) return;

      setMessagesMap((prev) => {
        const existing = prev[chatKey] || [];
        return {
          ...prev,
          [chatKey]: existing.map((m) =>
            (tempId && String(m.id) === String(tempId)) || String(m.id) === String(realId)
              ? { ...m, id: realId, senderId: serverMsg.senderId, isMe: true }
              : m
          )
        };
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_reaction_added', handleReactionAdded);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_reaction_added', handleReactionAdded);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, activeChatId, user]);

  const activeChat = useMemo(() => {
    return activeChatId ? conversations.find((c) => String(c.id) === String(activeChatId)) : null;
  }, [activeChatId, conversations]);

  // E2EE Derived Shared Secret Key State
  const [activeAESKey, setActiveAESKey] = useState(null);

  // Keep ref updated for socket event handlers
  useEffect(() => {
    activeAESKeyRef.current = activeAESKey;
  }, [activeAESKey]);

  // Derive Shared Key when active chat changes
  useEffect(() => {
    let isMounted = true;
    const setupE2EEKey = async () => {
      if (!user?.id || !activeChat || activeChat.isGroup) {
        if (isMounted) setActiveAESKey(null);
        return;
      }

      try {
        const myKeys = await getOrGenerateUserKeys(user.id);
        let friendPubKeyJwk = activeChat.publicKey || activeChat.publickey;
        const targetContactId = activeChat.contactId || activeChat.contactid || activeChat.recipientId || activeChat.userId;

        if (!friendPubKeyJwk && targetContactId) {
          try {
            const uRes = await apiRequest(`/users/${targetContactId}`);
            if (uRes?.user?.publicKey) {
              friendPubKeyJwk = uRes.user.publicKey;
            }
          } catch (fetchErr) {}
        }

        let friendPubKey = null;
        if (friendPubKeyJwk) {
          friendPubKey = await importPublicKey(friendPubKeyJwk);
        }

        // If friend registered earlier and doesn't have a public key yet, generate a fallback key
        if (!friendPubKey && targetContactId) {
          friendPubKey = await getFallbackPeerPublicKey(targetContactId);
        }

        if (friendPubKey && myKeys?.privateKey) {
          const aesKey = await deriveSharedKey(myKeys.privateKey, friendPubKey);
          if (isMounted) setActiveAESKey(aesKey);
          return;
        }
      } catch (err) {
        console.error('E2EE key derivation error:', err);
      }

      if (isMounted) setActiveAESKey(null);
    };

    setupE2EEKey();
    return () => { isMounted = false; };
  }, [activeChat, user?.id]);

  const decryptedMsgIdsRef = useRef(new Set());

  // Decrypt messages when activeAESKey becomes available or when message count changes
  const activeMsgCount = activeChatId && Array.isArray(messagesMap[activeChatId]) ? messagesMap[activeChatId].length : 0;

  useEffect(() => {
    if (!activeChatId || !activeAESKey) return;

    const msgs = messagesMap[activeChatId];
    if (!Array.isArray(msgs) || msgs.length === 0) return;

    const pendingDecryption = msgs.filter(
      (m) => typeof m.text === 'string' && m.text.startsWith('E2EE_V1::') && !decryptedMsgIdsRef.current.has(m.id)
    );

    if (pendingDecryption.length === 0) return;

    let isMounted = true;
    const decryptAll = async () => {
      const decryptedMsgs = await Promise.all(
        msgs.map(async (m) => {
          if (typeof m.text === 'string' && m.text.startsWith('E2EE_V1::') && !decryptedMsgIdsRef.current.has(m.id)) {
            const plain = await decryptMessage(m.text, activeAESKey);
            if (plain) {
              decryptedMsgIdsRef.current.add(m.id);
              return { ...m, text: plain };
            }
          }
          return m;
        })
      );

      if (isMounted) {
        setMessagesMap((prev) => ({
          ...prev,
          [activeChatId]: decryptedMsgs
        }));
      }
    };

    decryptAll();
    return () => { isMounted = false; };
  }, [activeChatId, activeAESKey, activeMsgCount]);

  const activeMessages = useMemo(() => {
    return activeChatId ? messagesMap[activeChatId] || [] : [];
  }, [activeChatId, messagesMap]);

  // Handle Send Message (Encrypts with E2EE, then persists & broadcasts)
  const handleSendMessage = async (text, options = {}) => {
    if (!activeChatId) return;

    playChimeSound('send');

    // Encrypt payload if E2EE shared key is available
    let payloadText = text;
    if (activeAESKey) {
      payloadText = await encryptMessage(text, activeAESKey);
    }

    const tempId = Date.now();
    const newMsg = {
      id: tempId,
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
        tempId: tempId,
        chatId: activeChatId,
        conversationId: activeChatId,
        recipientId: activeChat?.recipientId || activeChat?.contactId,
        text: payloadText,
        content: payloadText,
        replyToId: options.replyToId,
        isForwarded: options.isForwarded
      });
    } else {
      // 2. Fallback to REST API ONLY if real-time socket engine is disconnected
      try {
        const res = await apiRequest('/messages', 'POST', {
          chatId: activeChatId,
          conversationId: activeChatId,
          content: payloadText,
          replyToId: options.replyToId || null,
          isForwarded: Boolean(options.isForwarded)
        });

        if (res && res.message && res.message.id) {
          const realId = res.message.id;
          setMessagesMap((prev) => {
            const existing = prev[activeChatId] || [];
            return {
              ...prev,
              [activeChatId]: existing.map((m) =>
                String(m.id) === String(tempId) ? { ...m, id: realId } : m
              )
            };
          });
        }
      } catch (err) {
        console.error('Failed to persist message via REST:', err.message);
      }
    }
  };

  const handleMessageAction = async (action, payload) => {
    if (!activeChatId) return;
    const recipientId = activeChat?.recipientId || activeChat?.contactId;

    if (action === 'delete') {
      const targetMsgId = payload.messageId;
      const deleteType = payload.deleteType || (payload.isMe ? 'everyone' : 'me');

      if (deleteType === 'everyone') {
        // --- DELETE FOR EVERYONE ---
        setMessagesMap((prev) => {
          const existing = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: existing.map((m) =>
              String(m.id) === String(targetMsgId)
                ? { ...m, text: '🚫 This message was deleted', isDeleted: true, reactions: [] }
                : m
            )
          };
        });

        if (socket && isConnected) {
          socket.emit('delete_message', { messageId: targetMsgId, chatId: activeChatId, recipientId, deleteType: 'everyone' });
        }

        try {
          await apiRequest(`/messages/${targetMsgId}/everyone`, 'DELETE');
        } catch (err) {
          console.error('Failed to delete for everyone via REST:', err.message);
        }
      } else {
        // --- DELETE FOR ME ONLY ---
        setMessagesMap((prev) => {
          const existing = prev[activeChatId] || [];
          return {
            ...prev,
            [activeChatId]: existing.filter((m) => String(m.id) !== String(targetMsgId))
          };
        });

        if (socket && isConnected) {
          socket.emit('delete_message', { messageId: targetMsgId, chatId: activeChatId, recipientId, deleteType: 'me' });
        }

        try {
          await apiRequest(`/messages/${targetMsgId}/me`, 'DELETE');
        } catch (err) {
          console.error('Failed to delete for me via REST:', err.message);
        }
      }
    } else if (action === 'edit') {
      const targetMsgId = payload.messageId;
      const newText = payload.newText;

      setMessagesMap((prev) => {
        const existing = prev[activeChatId] || [];
        return {
          ...prev,
          [activeChatId]: existing.map((m) =>
            String(m.id) === String(targetMsgId) ? { ...m, text: newText, isEdited: true } : m
          )
        };
      });

      if (socket && isConnected) {
        socket.emit('edit_message', { messageId: targetMsgId, newText, chatId: activeChatId, recipientId });
      }
    } else if (action === 'react') {
      if (socket && isConnected) {
        socket.emit('add_reaction', { messageId: payload.messageId, emoji: payload.emoji, chatId: activeChatId, recipientId });
      }
    }
  };

  const handleStartChatWithContact = async (contact) => {
    setIsSearchOpen(false);
    setIsDrawerOpen(false);

    try {
      const recipientId = contact.id || contact.contactId;
      if (recipientId) {
        const res = await apiRequest('/chats', 'POST', { recipientId });
        if (res && (res.chat || res.conversation)) {
          const chatObj = res.chat || res.conversation;
          const convId = chatObj.id;

          await refreshConversations();
          selectChat(convId);
          return;
        }
      }
    } catch (err) {
      console.log('Failed to create/get chat from backend:', err.message);
    }

    selectChat('');
  };

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
              onSelectChat={selectChat}
              onOpenNewChat={() => setIsSearchOpen(true)}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
              onDeleteChat={deleteChat}
              onClearChat={clearChat}
              onToggleFavorite={toggleFavoriteChat}
              onStartChatWithContact={handleStartChatWithContact}
              onViewProfile={handleViewProfile}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              friends={friends}
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              incomingCount={incomingCount}
              onAcceptRequest={acceptFriendRequest}
              onRejectRequest={rejectFriendRequest}
              onCancelRequest={cancelFriendRequest}
              onRemoveFriend={removeFriend}
              onSendFriendRequest={sendFriendRequest}
              loadingSocial={loadingSocial}
            />
          </div>

          {/* Active Chat Window */}
          <div className={`flex-1 h-full min-w-0 overflow-hidden ${
            mobileView === 'chat' ? 'block' : 'hidden md:block'
          }`}>
            <ChatWindow
              activeChat={activeChat}
              messages={activeMessages}
              activeAESKey={activeAESKey}
              onSendMessage={handleSendMessage}
              onMessageAction={handleMessageAction}
              onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
              onBackToSidebar={() => {
                selectChat('');
                setMobileView('sidebar');
              }}
              onDeleteChat={deleteChat}
              onClearChat={clearChat}
              onToggleFavorite={toggleFavoriteChat}
            />
          </div>

          {/* Slide-Out Contact Detail Drawer */}
          <div className={`fixed md:relative inset-y-0 right-0 z-50 md:z-auto transition-transform duration-300 transform ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}>
            <ContactDrawer
              contact={drawerContact || activeChat}
              isOpen={isDrawerOpen}
              onClose={() => {
                setIsDrawerOpen(false);
                setDrawerContact(null);
              }}
              onLeaveGroup={handleLeaveGroup}
              onDeleteGroup={handleDeleteGroup}
              onSendFriendRequest={sendFriendRequest}
              onAcceptRequest={acceptFriendRequest}
              onCancelRequest={cancelFriendRequest}
              onRemoveFriend={removeFriend}
              onStartChat={(c) => {
                handleStartChatWithContact(c);
                setDrawerContact(null);
              }}
            />
            </div>
          </>
        ) : (
          <Outlet context={{
            onStartChat: handleStartChatWithContact,
            onOpenNewChat: () => setIsSearchOpen(true),
            onOpenCreateGroup: () => setIsCreateGroupOpen(true),
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
        onSelectUser={handleViewProfile}
        onSendFriendRequest={sendFriendRequest}
        onAcceptRequest={acceptFriendRequest}
        onCancelRequest={cancelFriendRequest}
        onStartChat={(u) => {
          handleStartChatWithContact(u);
          setIsSearchOpen(false);
        }}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        conversations={conversations}
      />

    </div>
  );
};

export default ChatScreen;
