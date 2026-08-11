import React, { useState, useRef, useEffect } from 'react';
import InputEmoji from 'react-input-emoji';
import { 
  FaPhoneAlt, 
  FaVideo, 
  FaSearch, 
  FaInfoCircle, 
  FaPaperclip, 
  FaMicrophone, 
  FaPaperPlane, 
  FaCheckDouble, 
  FaReply, 
  FaCopy, 
  FaTrash,
  FaImage,
  FaFileAlt,
  FaArrowLeft,
  FaTimes,
  FaStar,
  FaCheck
} from 'react-icons/fa';
import CallModal from './CallModal';

const ChatWindow = ({ activeChat, messages, onSendMessage, onToggleDrawer, onBackToSidebar }) => {
  const [inputText, setInputText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  // Header Search in Chat State
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');

  // Call Modal State
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState('audio');

  // Reply & Notification Toast State
  const [replyingTo, setReplyingTo] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [starredMsgIds, setStarredMsgIds] = useState(new Set());

  // Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording timer effect
  useEffect(() => {
    let timer;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSendText = (text) => {
    if (!text || !text.trim()) return;

    let textToSend = text.trim();
    if (replyingTo) {
      textToSend = `[Replying to "${replyingTo.text}"]: ${textToSend}`;
    }

    onSendMessage(textToSend);
    setInputText('');
    setReplyingTo(null);
    setShowAttachmentMenu(false);
  };

  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    onSendMessage(`🎤 Voice Note (${recordingTime}s)`);
    showToast('Voice note sent!');
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
      <div className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl mb-4 shadow-xl">
          💬
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Welcome to ChatApp Pro</h2>
        <p className="text-slate-400 text-sm max-w-sm">
          Select a contact from the sidebar or click the <span className="text-emerald-400 font-bold">+</span> button to start a new 1-on-1 real-time conversation.
        </p>
      </div>
    );
  }

  const filteredMessages = chatSearchTerm
    ? messages.filter((m) => (m.text || m.message || '').toLowerCase().includes(chatSearchTerm.toLowerCase()))
    : messages;

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

          {/* Audio Call */}
          <button
            onClick={() => handleStartCall('audio')}
            className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition"
            title="Audio Call"
          >
            <FaPhoneAlt className="text-xs md:text-sm" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleStartCall('video')}
            className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition"
            title="Video Call"
          >
            <FaVideo className="text-xs md:text-sm" />
          </button>

          {/* Contact Drawer */}
          <button
            onClick={onToggleDrawer}
            className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition"
            title="Contact Info"
          >
            <FaInfoCircle className="text-xs md:text-sm" />
          </button>
        </div>
      </header>

      {/* 2. MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60 pb-20 md:pb-6">
        
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 rounded-full">
            Today
          </span>
        </div>

        {/* Message Thread */}
        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === 'me' || msg.isMe;
          const msgText = msg.text || msg.message || '';
          const isStarred = starredMsgIds.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className={`relative max-w-[85%] sm:max-w-xs md:max-w-md lg:max-w-lg p-3.5 rounded-2xl text-sm transition-all duration-200 ${
                isMe
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-md'
              }`}>

                {/* Starred Badge */}
                {isStarred && (
                  <span className="absolute -top-2 -right-2 p-1 bg-amber-500 text-slate-950 rounded-full text-[10px] shadow">
                    <FaStar />
                  </span>
                )}

                <p className="leading-relaxed break-words text-xs sm:text-sm">{msgText}</p>

                {/* Footer Time & Status */}
                <div className={`flex items-center justify-end space-x-1 text-[10px] mt-1.5 ${
                  isMe ? 'text-emerald-200' : 'text-slate-500'
                }`}>
                  <span>{msg.time || '10:45 AM'}</span>
                  {isMe && <FaCheckDouble className="text-xs text-cyan-300" />}
                </div>

                {/* BUBBLE HOVER ACTIONS MENU */}
                <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-xl z-20 ${
                  isMe ? '-left-24' : '-right-24'
                }`}>
                  <button
                    onClick={() => setReplyingTo({ id: msg.id, text: msgText })}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition"
                    title="Reply"
                  >
                    <FaReply className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleCopyMessage(msgText)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition"
                    title="Copy Text"
                  >
                    <FaCopy className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleToggleStar(msg.id)}
                    className={`p-1.5 rounded-lg hover:bg-slate-800 transition ${
                      isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'
                    }`}
                    title="Star Message"
                  >
                    <FaStar className="text-xs" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT BAR WITH REACT-INPUT-EMOJI */}
      <footer className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0 relative mb-16 md:mb-0">
        
        {/* Reply Bar Overlay */}
        {replyingTo && (
          <div className="mb-2 p-2 bg-slate-950 border-l-4 border-emerald-500 rounded-r-xl flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="text-emerald-400 font-bold block">Replying to message:</span>
              <span className="text-slate-300 italic truncate block">"{replyingTo.text}"</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Attachment Menu Popover */}
        {showAttachmentMenu && (
          <div className="absolute bottom-20 left-4 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-30 space-y-1 min-w-[150px]">
            <button
              onClick={() => {
                onSendMessage('📷 Shared Image Attachment: photo_sample.png');
                setShowAttachmentMenu(false);
              }}
              className="w-full flex items-center space-x-2 p-2 hover:bg-slate-800 rounded-xl text-xs text-slate-300 transition"
            >
              <FaImage className="text-emerald-400 text-sm" />
              <span>Photo / Image</span>
            </button>
            <button
              onClick={() => {
                onSendMessage('📄 Shared Document: project_specs.pdf');
                setShowAttachmentMenu(false);
              }}
              className="w-full flex items-center space-x-2 p-2 hover:bg-slate-800 rounded-xl text-xs text-slate-300 transition"
            >
              <FaFileAlt className="text-teal-400 text-sm" />
              <span>Document File</span>
            </button>
          </div>
        )}

        {/* Voice Recording / Input Emoji Bar */}
        {isRecordingVoice ? (
          <div className="flex items-center justify-between bg-slate-950 border border-red-500/40 rounded-xl p-2.5 px-4 text-xs">
            <div className="flex items-center space-x-3 text-red-400 font-bold animate-pulse">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span>Recording Voice Note... ({recordingTime}s)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRecordingVoice(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendVoiceNote}
                className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center space-x-1"
              >
                <FaPaperPlane className="text-xs" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            
            {/* Attachment Toggle */}
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2 sm:p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition shrink-0"
              title="Attach File"
            >
              <FaPaperclip className="text-base sm:text-lg" />
            </button>

            {/* REACT-INPUT-EMOJI COMPONENT */}
            <div className="flex-1 min-w-0 text-white">
              <InputEmoji
                value={inputText}
                onChange={setInputText}
                cleanOnEnter
                onEnter={handleSendText}
                placeholder={`Message ${activeChat.name}...`}
                background="#020617"
                color="#ffffff"
                borderColor="#1e293b"
                borderRadius={12}
                fontSize={14}
                fontFamily="sans-serif"
              />
            </div>

            {/* Mic / Send Action Button */}
            {inputText.trim() ? (
              <button
                type="button"
                onClick={() => handleSendText(inputText)}
                className="p-2.5 sm:p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center font-bold shrink-0"
                title="Send Message"
              >
                <FaPaperPlane className="text-xs sm:text-sm" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="p-2.5 sm:p-3 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl transition flex items-center justify-center font-bold shrink-0"
                title="Record Voice Note"
              >
                <FaMicrophone className="text-xs sm:text-sm" />
              </button>
            )}

          </div>
        )}

      </footer>

      {/* Audio / Video Call Modal */}
      <CallModal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        contact={activeChat}
        callType={callType}
      />

    </div>
  );
};

export default ChatWindow;
