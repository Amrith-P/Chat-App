import React, { useState, useEffect } from 'react';
import { 
  FaPhoneSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVideo, 
  FaVideoSlash, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaExpand, 
  FaCompress 
} from 'react-icons/fa';

const CallModal = ({ isOpen, onClose, contact, callType = 'audio' }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !contact) return null;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[520px]">
        
        {/* Background / Video Feed Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
          
          {!isVideoOff ? (
            /* Simulated Video Stream */
            <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-full h-full object-cover opacity-60 filter blur-sm transform scale-105"
              />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />
              
              {/* Remote Contact Video Frame */}
              <div className="relative z-10 text-center space-y-3">
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-28 h-28 rounded-full border-4 border-emerald-500/80 mx-auto object-cover shadow-2xl"
                />
                <h3 className="text-xl font-bold text-white tracking-tight">{contact.name}</h3>
                <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
                  HD Video Connected • {formatDuration(callDuration)}
                </p>
              </div>

              {/* Picture-in-Picture Local User Video Preview */}
              <div className="absolute bottom-4 right-4 w-28 h-36 bg-slate-900 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-xl">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me"
                  alt="My Video"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 left-2 text-[9px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">You</span>
              </div>
            </div>
          ) : (
            /* Audio Call Interface */
            <div className="text-center space-y-5 p-6 z-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <img
                  src={contact.avatar}
                  alt={contact.name}
                  className="w-32 h-32 rounded-full border-4 border-emerald-500 mx-auto object-cover shadow-2xl relative z-10"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{contact.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{contact.status || 'ChatApp Pro Voice Call'}</p>
                <p className="text-sm text-emerald-400 font-mono font-bold mt-2">
                  {formatDuration(callDuration)}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* CONTROLS BAR */}
        <div className="h-24 bg-slate-950/90 border-t border-slate-800/80 px-6 flex items-center justify-around shrink-0">
          
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition ${
              isMuted
                ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition ${
              isVideoOff
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </button>

          {/* Speaker Toggle */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition ${
              !isSpeakerOn
                ? 'bg-slate-800 text-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          >
            {isSpeakerOn ? <FaVolumeUp /> : <FaVolumeMute />}
          </button>

          {/* End Call */}
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-red-500 hover:bg-red-400 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-red-500/30 transition transform hover:scale-105"
            title="End Call"
          >
            <FaPhoneSlash />
          </button>

        </div>

      </div>
    </div>
  );
};

export default CallModal;
