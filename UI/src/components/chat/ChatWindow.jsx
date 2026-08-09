import React, { useState, useRef, useEffect } from 'react';
import { 
  FaPhoneAlt, 
  FaVideo, 
  FaSearch, 
  FaInfoCircle, 
  FaEllipsisV, 
  FaSmile, 
  FaPaperclip, 
  FaMicrophone, 
  FaPaperPlane, 
  FaCheckDouble, 
  FaReply, 
  FaCopy, 
  FaTrash,
  FaImage,
  FaFileAlt,
  FaArrowLeft
} from 'react-icons/fa';

const ChatWindow = ({ activeChat, messages, onSendMessage, onToggleDrawer, onBackToSidebar }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const addEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
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

  const emojis = ['😊', '😂', '🔥', '👍', '❤️', '🎉', '🚀', '💯', '✨', '🙌'];

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden relative">
      
      {/* 1. CHAT HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-10">
        
        {/* Contact Info & Back Arrow for Mobile */}
        <div className="flex items-center space-x-3">
          {/* Mobile Back Button */}
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
                {activeChat.isOnline ? 'Online • Typing...' : 'Last seen recently'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center space-x-1 md:space-x-2 text-slate-400">
          <button className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Audio Call">
            <FaPhoneAlt className="text-xs md:text-sm" />
          </button>
          <button className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Video Call">
            <FaVideo className="text-xs md:text-sm" />
          </button>
          <button className="hidden sm:block p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Search in Chat">
            <FaSearch className="text-xs md:text-sm" />
          </button>
          <button onClick={onToggleDrawer} className="p-2 md:p-2.5 rounded-xl hover:bg-slate-800 hover:text-white transition" title="Contact Info">
            <FaInfoCircle className="text-xs md:text-sm" />
          </button>
        </div>
      </header>

      {/* 2. MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/60 pb-20 md:pb-6">
        
        {/* Date Divider */}
        <div className="flex justify-center my-2">
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 rounded-full">
            Today
          </span>
        </div>

        {/* Message Thread */}
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me' || msg.isMe;
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
                <p className="leading-relaxed break-words text-xs sm:text-sm">{msg.text || msg.message}</p>

                {/* Footer Time & Read Receipt */}
                <div className={`flex items-center justify-end space-x-1 text-[10px] mt-1.5 ${
                  isMe ? 'text-emerald-200' : 'text-slate-500'
                }`}>
                  <span>{msg.time || '10:45 AM'}</span>
                  {isMe && <FaCheckDouble className="text-xs text-cyan-300" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Bubble */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 pl-2">
          <div className="flex space-x-1 items-center bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-[11px] italic font-medium">{activeChat.name} is typing...</span>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT BAR */}
      <footer className="p-3 md:p-4 bg-slate-900 border-t border-slate-800 shrink-0 relative mb-16 md:mb-0">
        
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-2 sm:left-4 bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-3 shadow-2xl z-30 flex gap-1.5 sm:gap-2">
            {emojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => addEmoji(e)}
                className="text-lg sm:text-xl hover:scale-125 transition transform p-1"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {/* Attachment Menu Popover */}
        {showAttachmentMenu && (
          <div className="absolute bottom-20 left-10 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl z-30 space-y-1 min-w-[140px]">
            <button className="w-full flex items-center space-x-2 p-2 hover:bg-slate-800 rounded-xl text-xs text-slate-300">
              <FaImage className="text-emerald-400" />
              <span>Image / Photo</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-2 hover:bg-slate-800 rounded-xl text-xs text-slate-300">
              <FaFileAlt className="text-teal-400" />
              <span>Document</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-2 md:space-x-3">
          
          {/* Controls */}
          <div className="flex items-center space-x-0.5 text-slate-400">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 sm:p-2.5 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition"
              title="Add Emoji"
            >
              <FaSmile className="text-base sm:text-lg" />
            </button>
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2 sm:p-2.5 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition"
              title="Attach File"
            >
              <FaPaperclip className="text-base sm:text-lg" />
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 sm:px-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Action Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 sm:p-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center font-bold"
          >
            <FaPaperPlane className="text-xs sm:text-sm" />
          </button>
        </form>

      </footer>

    </div>
  );
};

export default ChatWindow;
