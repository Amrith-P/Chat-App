import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';

const CallContext = createContext();

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();

  // Call States: 'idle' | 'calling' | 'incoming' | 'connected'
  const [callState, setCallState] = useState('idle');
  const [callType, setCallType] = useState('video');
  const [peerContact, setPeerContact] = useState(null);
  const [incomingSignal, setIncomingSignal] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  // Cleanup helper
  const cleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
    setLocalStream(null);
    setRemoteStream(null);
    setPeerContact(null);
    setIncomingSignal(null);
    setCallState('idle');
    setIsMuted(false);
    setIsVideoOff(false);
  }, []);

  // Create RTCPeerConnection instance
  const createPeerConnection = useCallback((targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          targetUserId,
          candidate: event.candidate
        });
      }
    };

    // Remote Stream listener
    pc.ontrack = (event) => {
      console.log('📡 WebRTC ontrack event received:', event);
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else if (event.track) {
        const newStream = new MediaStream([event.track]);
        remoteStreamRef.current = newStream;
        setRemoteStream(newStream);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket]);

  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const getTargetUserId = (contact) => {
    if (!contact) return null;
    if (contact.isGroup) return null;
    return Number(
      contact.contactId ?? 
      contact.contactid ?? 
      contact.userId ?? 
      contact.userid ?? 
      contact.recipientId ?? 
      contact.id
    );
  };

  // Start Outgoing Call
  const startCall = useCallback(async (targetContact, type = 'video') => {
    if (!targetContact || !socket) return;

    if (targetContact.isGroup) {
      alert('Group calls are not supported. Please select a direct contact to start a video call.');
      return;
    }

    cleanupCall();

    const targetUserId = getTargetUserId(targetContact);
    if (!targetUserId) {
      alert('Invalid contact details for video call.');
      return;
    }

    console.log(`🚀 Starting outgoing ${type} call to targetUserId: ${targetUserId}`);

    setCallType(type);
    setPeerContact(targetContact);
    setCallState('calling');
    setIsVideoOff(type === 'audio');

    try {
      // Request User Camera & Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(targetUserId);

      // Add local media tracks to PeerConnection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create WebRTC Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send Call Signal via Socket.IO
      socket.emit('call_user', {
        targetUserId,
        signalData: offer,
        isVideo: type === 'video'
      });
    } catch (err) {
      console.error('Failed to get media devices for call:', err);
      alert('Unable to access camera or microphone. Please check permissions.');
      cleanupCall();
    }
  }, [socket, createPeerConnection, cleanupCall]);

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    if (!peerContact || !incomingSignal || !socket) return;

    const targetUserId = getTargetUserId(peerContact) || Number(peerContact.id || peerContact.callerId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(targetUserId);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Set Remote SDP Offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));

      // Process buffered ICE candidates if any
      while (pendingIceCandidatesRef.current.length > 0) {
        const candidate = pendingIceCandidatesRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding candidate:', e);
        }
      }

      // Create SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Acceptance via Socket.IO
      socket.emit('accept_call', {
        targetUserId,
        signalData: answer
      });

      setCallState('connected');
    } catch (err) {
      console.error('Error accepting call:', err);
      alert('Failed to establish media connection.');
      cleanupCall();
    }
  }, [peerContact, incomingSignal, socket, callType, createPeerConnection, cleanupCall]);

  // Reject Incoming Call
  const rejectCall = useCallback(() => {
    if (peerContact && socket) {
      const targetUserId = getTargetUserId(peerContact) || Number(peerContact.id || peerContact.callerId);
      socket.emit('reject_call', { targetUserId });
    }
    cleanupCall();
  }, [peerContact, socket, cleanupCall]);

  // End Active Call
  const endCall = useCallback(() => {
    if (peerContact && socket) {
      const targetUserId = getTargetUserId(peerContact) || Number(peerContact.id || peerContact.callerId);
      socket.emit('end_call', { targetUserId });
    }
    cleanupCall();
  }, [peerContact, socket, cleanupCall]);

  // Toggle Mute Audio
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle Camera Off/On
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [isVideoOff]);

  // Global Socket Signal Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 Incoming call signal received:', data);
      if (callStateRef.current !== 'idle') {
        // Auto reject if already in a call
        socket.emit('reject_call', { targetUserId: data.callerId });
        return;
      }

      setPeerContact({
        id: data.callerId,
        contactId: data.callerId,
        name: data.callerName,
        avatar: data.callerAvatar
      });
      setIncomingSignal(data.signalData);
      setCallType(data.isVideo ? 'video' : 'audio');
      setIsVideoOff(!data.isVideo);
      setCallState('incoming');
    };

    const handleCallAccepted = async (data) => {
      console.log('✅ Call accepted signal received:', data);
      const pc = peerConnectionRef.current;
      if (pc && data.signalData) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signalData));
          
          while (pendingIceCandidatesRef.current.length > 0) {
            const candidate = pendingIceCandidatesRef.current.shift();
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }

          setCallState('connected');
        } catch (e) {
          console.error('Failed to set remote description on acceptance:', e);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      } else {
        pendingIceCandidatesRef.current.push(data.candidate);
      }
    };

    const handleCallRejected = () => {
      alert('Call was declined');
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('ice_candidate_received', handleIceCandidate);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('ice_candidate_received', handleIceCandidate);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, cleanupCall]);

  // Call History State
  const [callHistory, setCallHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('chatapp_call_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const addCallLog = useCallback((log) => {
    setCallHistory((prev) => {
      const updated = [log, ...prev];
      try {
        localStorage.setItem('chatapp_call_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const clearCallHistory = useCallback(() => {
    setCallHistory([]);
    try {
      localStorage.removeItem('chatapp_call_history');
    } catch (e) {}
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        peerContact,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        callHistory,
        startCall: (targetContact, type) => {
          const targetUserId = getTargetUserId(targetContact);
          if (targetContact && targetUserId) {
            addCallLog({
              id: Date.now(),
              contactId: targetUserId,
              contactName: targetContact.name || 'Contact',
              contactAvatar: targetContact.avatar || '',
              callType: type || 'video',
              direction: 'outgoing',
              timestamp: new Date().toISOString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date().toLocaleDateString()
            });
          }
          startCall(targetContact, type);
        },
        acceptCall: () => {
          if (peerContact) {
            addCallLog({
              id: Date.now(),
              contactId: peerContact.id || peerContact.contactId,
              contactName: peerContact.name || 'Contact',
              contactAvatar: peerContact.avatar || '',
              callType: callType || 'video',
              direction: 'incoming',
              timestamp: new Date().toISOString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          acceptCall();
        },
        rejectCall: () => {
          if (peerContact) {
            addCallLog({
              id: Date.now(),
              contactId: peerContact.id || peerContact.contactId,
              contactName: peerContact.name || 'Contact',
              contactAvatar: peerContact.avatar || '',
              callType: callType || 'video',
              direction: 'missed',
              timestamp: new Date().toISOString(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
          rejectCall();
        },
        endCall,
        toggleMute,
        toggleVideo,
        clearCallHistory
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
