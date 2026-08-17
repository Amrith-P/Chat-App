import React from 'react';
import { FaPhone, FaPhoneSlash, FaVideo } from 'react-icons/fa';
import { useCall } from '../../context/CallContext';

const IncomingCallModal = () => {
  const { callState, callType, peerContact, acceptCall, rejectCall } = useCall();

  if (callState !== 'incoming' || !peerContact) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Ambient Ringing Glow */}
        <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />

        <div className="relative inline-block my-2">
          <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
          <img
            src={peerContact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(peerContact.name)}`}
            alt={peerContact.name}
            className="w-24 h-24 rounded-full border-4 border-emerald-500 mx-auto object-cover shadow-2xl relative z-10 bg-slate-800"
          />
        </div>

        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">{peerContact.name}</h3>
          <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center justify-center space-x-1.5">
            {callType === 'video' ? <FaVideo className="text-xs" /> : <FaPhone className="text-xs" />}
            <span>Incoming {callType === 'video' ? 'HD Video Call' : 'Voice Call'}...</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6 pt-2">
          
          {/* Reject Button */}
          <button
            onClick={rejectCall}
            className="w-14 h-14 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 flex items-center justify-center text-xl shadow-lg transition transform hover:scale-105"
            title="Decline Call"
          >
            <FaPhoneSlash />
          </button>

          {/* Accept Button */}
          <button
            onClick={acceptCall}
            className="w-16 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center text-2xl font-bold shadow-xl shadow-emerald-500/30 transition transform hover:scale-105"
            title="Accept Call"
          >
            <FaPhone />
          </button>

        </div>

      </div>
    </div>
  );
};

export default IncomingCallModal;
