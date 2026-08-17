import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPhoneSlash, 
  FaMicrophone, 
  FaMicrophoneSlash, 
  FaVideo, 
  FaVideoSlash 
} from 'react-icons/fa';
import { useCall } from '../../context/CallContext';

const CallModal = () => {
  const { 
    callState, 
    callType, 
    peerContact, 
    localStream, 
    remoteStream, 
    isMuted, 
    isVideoOff, 
    endCall, 
    toggleMute, 
    toggleVideo 
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration counter
  useEffect(() => {
    if (callState !== 'connected') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState]);

  if ((callState !== 'calling' && callState !== 'connected') || !peerContact) {
    return null;
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[520px]">
        
        {/* Background / Video Feed Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-slate-950">
          
          {callType === 'video' && remoteStream ? (
            /* Live Remote Video Stream */
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            /* Calling / Audio Call Screen */
            <div className="text-center space-y-5 p-6 z-10">
              <div className="relative inline-block">
                <div className={`absolute inset-0 rounded-full bg-emerald-500/20 ${callState === 'calling' ? 'animate-ping' : ''}`} />
                <img
                  src={peerContact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peerContact.name)}`}
                  alt={peerContact.name}
                  className="w-28 h-28 rounded-full border-4 border-emerald-500 mx-auto object-cover shadow-2xl relative z-10 bg-slate-800"
                />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{peerContact.name}</h3>
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  {callState === 'calling' 
                    ? 'Calling...' 
                    : (callType === 'video' ? 'HD Video Call' : 'Voice Call')}
                </p>
                {callState === 'connected' && (
                  <p className="text-sm text-emerald-400 font-mono font-bold mt-2">
                    {formatDuration(callDuration)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Picture-in-Picture Local Camera Feed */}
          {callType === 'video' && (
            <div className="absolute bottom-4 right-4 w-28 h-36 bg-slate-900 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-xl z-20">
              {!isVideoOff && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <FaVideoSlash className="text-base mb-1" />
                  <span>Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 text-[9px] bg-slate-950/80 px-1.5 py-0.5 rounded text-slate-300">You</span>
            </div>
          )}

        </div>

        {/* CONTROLS BAR */}
        <div className="h-24 bg-slate-950/90 border-t border-slate-800/80 px-6 flex items-center justify-around shrink-0">
          
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition ${
              isMuted
                ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>

          {/* Toggle Camera */}
          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg transition ${
                isVideoOff
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
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
