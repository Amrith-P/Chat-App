import React, { useState, useRef, useEffect } from 'react';
import InputEmoji from 'react-input-emoji';
import { 
  FaPhoneAlt, 
  FaVideo, 
  FaSearch, 
  FaInfoCircle, 
  FaPaperPlane, 
  FaCheck,
  FaCheckDouble, 
  FaReply, 
  FaCopy, 
  FaTrash,
  FaArrowLeft,
  FaTimes,
  FaStar,
  FaShare,
  FaPen,
  FaSmile
} from 'react-icons/fa';
import CallModal from './CallModal';
import ConfirmModal from '../common/ConfirmModal';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ChatWindow = ({ activeChat, messages, onSendMessage, onMessageAction, onToggleDrawer, onBackToSidebar }) => {
  const [inputText, setInputText] = useState('');
  
  // Header Search in Chat State
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');

  // Call Modal State
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState('audio');

  // Action States
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [starredMsgIds, setStarredMsgIds] = useState(new Set());

  // Delete Confirmation Modal State
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSendText = (text) => {
    if (!text || !text.trim()) return;

    if (editingMsg) {
      onMessageAction('edit', { messageId: editingMsg.id, newText: text.trim() });
      setEditingMsg(null);
    } else {
      onSendMessage(text.trim(), { replyToId: replyingTo?.id });
      setReplyingTo(null);
    }
    
    setInputText('');
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Message copied to clipboard! 📋');
  };

  const handleToggleStar = (msgId) => {
    setStarredMsgIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(msgId)) {
        updated.delete(msgId);
        showToast('Unstarred message');
      } else {
        updated.add(msgId);
        showToast('Starred message! ⭐');
      }
      return updated;
    });
  };

  const handleStartCall = (type) => {
    setCallType(type);
    setIsCallOpen(true);
  };

  if (!activeChat) {
    return (
      <div className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 text-3xl mb-4 shadow-xl">
          💬
        </div>
        <h3 className="text-lg font-bold text-white mb-1">ChatApp Pro</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Select a conversation from the sidebar or search registered users to start messaging in real-time.
        </p>
      </div>
    );
  }

  const filteredMessages = chatSearchTerm
    ? messages.filter((m) => (m.text || m.message || '').toLowerCase().includes(chatSearchTerm.toLowerCase()))
    : messages;

  // Group messages by Date
  const groupedMessages = {};
  filteredMessages.forEach(msg => {
    const dateKey = msg.date || new Date().toLocaleDateString();
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 border border-emerald-500/40 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce">
          <FaCheck />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CHAT HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-10">
        
        {/* Contact Info & Mobile Back Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition -ml-1"
            title="Back to Chats"
          >
            <FaArrowLeft className="text-base" />
          </button>

          <div className="flex items-center space-x-3 cursor-pointer" onClick={onToggleDrawer}>
            <div className="relative">
              <img
                src={activeChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeChat.name)}`}
                alt={activeChat.name}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-slate-700 shadow-md"
              />
              {activeChat.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white truncate max-w-[140px] sm:max-w-xs">
                {activeChat.name}
              </h3>
              <p className="text-[11px] md:text-xs text-emerald-400 font-medium truncate">
                {activeChat.isOnline ? 'Online • Available' : 'Last seen recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center space-x-1 md:space-x-2 text-slate-400">
          {/* In-Chat Search Bar Toggle */}
          {isSearchInChatOpen ? (
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatSearchTerm}
                onChange={(e) => setChatSearchTerm(e.target.value)}
                placeholder="Search in chat..."
                className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-3 pr-7 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition w-36 sm:w-48"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchInChatOpen(false);
                  setChatSearchTerm('');
                }}
                className="absolute right-2 text-slate-400 hover:text-white text-xs"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchInChatOpen(true)}
              className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition"
              title="Search in Chat"
            >
              <FaSearch className="text-xs md:text-sm" />
            </button>
          )}

          <button onClick={() => handleStartCall('audio')} className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Audio Call">
            <FaPhoneAlt className="text-xs md:text-sm" />
          </button>

          <button onClick={() => handleStartCall('video')} className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Video Call">
            <FaVideo className="text-xs md:text-sm" />
          </button>

          <button onClick={onToggleDrawer} className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Contact Info">
            <FaInfoCircle className="text-xs md:text-sm" />
          </button>
        </div>
      </header>

      {/* 2. MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60 pb-20 md:pb-6 flex flex-col">
        
        {filteredMessages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 text-2xl mb-3 shadow-lg">
              👋
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No messages yet</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Say hello 👋 to start the conversation with <span className="text-slate-200 font-semibold">{activeChat.name}</span>!
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
          <React.Fragment key={date}>
            <div className="flex justify-center my-4 sticky top-2 z-10">
              <span className="px-3 py-1 bg-slate-900/80 backdrop-blur border border-slate-800 text-[11px] font-semibold text-slate-400 rounded-full shadow-md">
                {date === new Date().toLocaleDateString() ? 'Today' : date}
              </span>
            </div>

            {msgs.map((msg) => {
              const isMe = msg.senderId === 'me' || msg.isMe;
              const msgText = msg.text || '';
              const isStarred = starredMsgIds.has(msg.id);
              
              // Find replied message text if it exists
              let repliedMsg = null;
              if (msg.replyToId) {
                repliedMsg = messages.find(m => m.id === msg.replyToId);
              }

              // Determine Ticks for sent messages
              let tickIcon = <FaCheck className="text-[10px] text-slate-500" />;
              if (!isMe) {
                tickIcon = null;
              } else if (msg.readAt) {
                tickIcon = <FaCheckDouble className="text-xs text-blue-400" />;
              } else if (msg.id > 1000000000000) { 
                // Using timestamp id as proxy for "delivered to server"
                tickIcon = <FaCheckDouble className="text-xs text-slate-400" />;
              }

              return (
                <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} mb-2`}>
                  
                  <div className={`relative min-w-[120px] max-w-[85%] sm:max-w-xs md:max-w-md lg:max-w-lg p-2 rounded-2xl text-sm transition-all duration-200 ${
                    isMe
                      ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-tr-none shadow-lg'
                      : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-none shadow-md'
                  }`}>
                    
                    {/* Forwarded Badge */}
                    {msg.isForwarded && (
                      <div className="flex items-center text-[10px] text-slate-300 italic mb-1 px-1">
                        <FaShare className="mr-1" /> Forwarded
                      </div>
                    )}

                    {/* Quoted Reply Block */}
                    {repliedMsg && (
                      <div className={`mb-1.5 p-2 rounded-xl text-xs border-l-4 ${isMe ? 'bg-emerald-900/50 border-emerald-400 text-emerald-100' : 'bg-slate-900/50 border-emerald-500 text-slate-300'}`}>
                        <div className={`font-bold mb-0.5 ${isMe ? 'text-emerald-300' : 'text-emerald-400'}`}>
                          {repliedMsg.isMe ? 'You' : repliedMsg.senderName || activeChat.name}
                        </div>
                        <div className="truncate opacity-80">{repliedMsg.text}</div>
                      </div>
                    )}

                    {/* Starred Badge */}
                    {isStarred && (
                      <span className="absolute -top-2 -right-2 p-1 bg-amber-500 text-slate-950 rounded-full text-[10px] shadow z-10">
                        <FaStar />
                      </span>
                    )}

                    {/* Main Content */}
                    <div className="px-1.5 pb-4">
                      <p className={`leading-relaxed break-words text-sm ${msg.isDeleted ? 'italic opacity-60' : ''}`}>
                        {msgText}
                      </p>
                    </div>

                    {/* Footer Time & Status */}
                    <div className={`absolute bottom-1.5 right-2 flex items-center space-x-1 text-[9px] ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {msg.isEdited && <span className="italic mr-1">Edited</span>}
                      <span>{msg.time || '10:45 AM'}</span>
                      {tickIcon}
                    </div>

                    {/* BUBBLE HOVER ACTIONS MENU */}
                    {!msg.isDeleted && (
                      <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 ${
                        isMe ? '-left-[150px]' : '-right-[150px]'
                      }`}>
                        
                        {/* Reaction Trigger */}
                        <div className="relative group/react">
                          <button className="p-2 text-slate-400 hover:text-amber-400 transition" title="React">
                            <FaSmile className="text-xs" />
                          </button>
                          {/* Quick Emoji Picker */}
                          <div className="absolute hidden group-hover/react:flex -top-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 p-1 rounded-full shadow-lg space-x-1">
                            {REACTIONS.map(emoji => (
                              <button key={emoji} onClick={() => onMessageAction('react', { messageId: msg.id, emoji })} className="hover:scale-125 transition-transform px-1 text-base">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button onClick={() => setReplyingTo({ id: msg.id, text: msgText, sender: isMe ? 'You' : activeChat.name })} className="p-2 text-slate-400 hover:text-emerald-400 transition" title="Reply">
                          <FaReply className="text-xs" />
                        </button>
                        <button onClick={() => onSendMessage(msgText, { isForwarded: true })} className="p-2 text-slate-400 hover:text-emerald-400 transition" title="Forward">
                          <FaShare className="text-xs" />
                        </button>
                        <button onClick={() => handleCopyMessage(msgText)} className="p-2 text-slate-400 hover:text-emerald-400 transition" title="Copy">
                          <FaCopy className="text-xs" />
                        </button>
                        {isMe && (
                          <>
                            <button onClick={() => { setEditingMsg(msg); setInputText(msgText); }} className="p-2 text-slate-400 hover:text-blue-400 transition" title="Edit">
                              <FaPen className="text-xs" />
                            </button>
                            <button onClick={() => setDeleteConfirmMsgId(msg.id)} className="p-2 text-slate-400 hover:text-red-400 transition" title="Delete">
                              <FaTrash className="text-xs" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 z-10 ${isMe ? 'mr-2' : 'ml-2'}`}>
                      {/* Group identical emojis */}
                      {Object.entries(msg.reactions.reduce((acc, r) => {
                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                        return acc;
                      }, {})).map(([emoji, count]) => (
                        <div key={emoji} className="bg-slate-800 border border-slate-700 rounded-full px-1.5 py-0.5 text-[11px] flex items-center space-x-1 shadow-sm">
                          <span>{emoji}</span>
                          {count > 1 && <span className="text-slate-400 font-bold">{count}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </React.Fragment>
        )))
        }

        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT BAR */}
      <footer className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0 relative mb-16 md:mb-0">
        
        {/* Reply/Edit Bar Overlay */}
        {(replyingTo || editingMsg) && (
          <div className="mb-2 p-2 bg-slate-950 border-l-4 border-emerald-500 rounded-r-xl flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-emerald-400 font-bold block">
                {editingMsg ? 'Editing message:' : `Replying to ${replyingTo.sender}:`}
              </span>
              <span className="text-slate-300 italic truncate block">
                "{editingMsg ? editingMsg.text : replyingTo.text}"
              </span>
            </div>
            <button
              onClick={() => {
                setReplyingTo(null);
                if (editingMsg) {
                  setEditingMsg(null);
                  setInputText('');
                }
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* REACT-INPUT-EMOJI COMPONENT */}
          <div className="flex-1 min-w-0 text-white">
            <InputEmoji
              value={inputText}
              onChange={setInputText}
              cleanOnEnter
              onEnter={handleSendText}
              placeholder={editingMsg ? "Edit your message..." : `Message ${activeChat.name}...`}
              background="#0f172a"
              color="#ffffff"
              borderColor="#1e293b"
              borderRadius={12}
              fontSize={14}
              fontFamily="sans-serif"
            />
          </div>

          {/* Send Action Button */}
          <button
            type="button"
            onClick={() => handleSendText(inputText)}
            disabled={!inputText.trim()}
            className={`p-2.5 sm:p-3 rounded-xl transition flex items-center justify-center font-bold shrink-0 ${
              inputText.trim() 
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
            title={editingMsg ? "Save Edit" : "Send Message"}
          >
            <FaPaperPlane className="text-xs sm:text-sm" />
          </button>
        </div>

      </footer>

      {/* Audio / Video Call Modal */}
      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        contact={activeChat}
        callType={callType}
      />

      {/* Delete Message Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmMsgId)}
        onClose={() => setDeleteConfirmMsgId(null)}
        onConfirm={() => {
          if (deleteConfirmMsgId) {
            onMessageAction('delete', { messageId: deleteConfirmMsgId });
            showToast('Message deleted');
            setDeleteConfirmMsgId(null);
          }
        }}
        title="Delete Message"
        message="Are you sure you want to delete this message? This will remove the message for everyone."
        confirmText="Delete"
        confirmVariant="danger"
      />

    </div>
  );
};

export default React.memo(ChatWindow);
