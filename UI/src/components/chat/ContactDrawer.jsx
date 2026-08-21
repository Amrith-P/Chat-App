import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaPhone, 
  FaVideo, 
  FaBell, 
  FaBan, 
  FaTrash, 
  FaShieldAlt, 
  FaEnvelope, 
  FaUsers, 
  FaUserPlus, 
  FaUserMinus, 
  FaSignOutAlt, 
  FaShieldVirus,
  FaCommentDots 
} from 'react-icons/fa';
import ConfirmModal from '../common/ConfirmModal';
import { useGroupChat } from '../../hooks/chat/useGroupChat';
import { useAuth } from '../../hooks/auth/useAuth';

import { useFriends } from '../../hooks/social/useFriends';

const ContactDrawer = ({ 
  contact, 
  isOpen, 
  onClose, 
  onLeaveGroup, 
  onDeleteGroup, 
  onSendFriendRequest,
  onRemoveFriend,
  onStartChat 
}) => {
  const { user } = useAuth();
  const { friends, incomingRequests, outgoingRequests, sendFriendRequest } = useFriends();
  const { getGroupMembers, removeGroupMember, updateMemberRole } = useGroupChat();
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState(null);

  const isGroup = Boolean(contact?.isGroup);
  const currentUserId = user?.id;

  // Fetch group members if opening a group chat
  useEffect(() => {
    if (!isOpen || !contact || !isGroup) return;

    let isMounted = true;
    setLoadingMembers(true);

    getGroupMembers(contact.id)
      .then((mList) => {
        if (isMounted) {
          setMembers(mList || []);
          setLoadingMembers(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load group members in drawer:', err);
        if (isMounted) setLoadingMembers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contact, isGroup, getGroupMembers]);

  if (!isOpen || !contact) return null;

  const currentUserRole = members.find((m) => String(m.id) === String(currentUserId))?.role || (String(contact.adminId) === String(currentUserId) ? 'admin' : 'member');
  const isCurrentAdmin = currentUserRole === 'admin' || String(contact.adminId) === String(currentUserId);

  const handleRemoveMember = (mId, mName) => {
    setConfirmConfig({
      title: 'Remove Group Member',
      message: `Are you sure you want to remove ${mName} from ${contact.name}?`,
      confirmText: 'Remove Member',
      onConfirm: async () => {
        try {
          await removeGroupMember(contact.id, mId);
          setMembers((prev) => prev.filter((m) => String(m.id) !== String(mId)));
        } catch (err) {
          alert(`Failed to remove member: ${err.message}`);
        }
      }
    });
  };

  const handleToggleRole = (mId, mName, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'member' : 'admin';
    const actionLabel = nextRole === 'admin' ? 'Promote to Admin' : 'Demote to Member';

    setConfirmConfig({
      title: `${actionLabel}?`,
      message: `Are you sure you want to change ${mName}'s role to ${nextRole}?`,
      confirmText: actionLabel,
      onConfirm: async () => {
        try {
          await updateMemberRole(contact.id, mId, nextRole);
          setMembers((prev) => prev.map((m) => String(m.id) === String(mId) ? { ...m, role: nextRole } : m));
        } catch (err) {
          alert(`Failed to update role: ${err.message}`);
        }
      }
    });
  };

  return (
    <div className="w-72 lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none shrink-0 z-10 transition-all duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
          <FaTimes />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Photo & Name */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <img
              src={contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.name)}`}
              alt={contact.name}
              className="w-24 h-24 rounded-full border-2 border-emerald-500/50 p-1 object-cover shadow-xl bg-slate-800"
            />
            {!isGroup && contact.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            )}
            {isGroup && (
              <span className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-slate-900 text-xs">
                <FaUsers />
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-0.5">{contact.name}</h2>
            <p className="text-xs text-slate-400 font-mono">
              {isGroup ? `${members.length || contact.memberCount || 1} members` : contact.email}
            </p>
          </div>

          {/* Relationship Action / Status Badge for 1-on-1 */}
          {!isGroup && (() => {
            const targetId = Number(contact.contactId || contact.id);
            const isFriend = friends.some((f) => Number(f.id) === targetId);
            const outgoingReq = outgoingRequests.find((r) => Number(r.receiverId) === targetId);
            const incomingReq = incomingRequests.find((r) => Number(r.senderId) === targetId);
            const isSelf = targetId === Number(currentUserId);

            if (isSelf) return null;

            if (isFriend) {
              return (
                <div className="pt-2 flex flex-col items-center space-y-2 justify-center">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center space-x-1">
                    <span>✓ Friends</span>
                  </span>
                  {onStartChat && (
                    <button
                      onClick={() => onStartChat(contact)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <FaCommentDots />
                      <span>Start Chat</span>
                    </button>
                  )}
                </div>
              );
            }

            if (outgoingReq) {
              return (
                <div className="pt-2 flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-xl cursor-default select-none">
                      ⏳ Pending
                    </span>
                    {(onCancelRequest || cancelFriendRequest) && (
                      <button
                        onClick={async () => {
                          try {
                            const fn = onCancelRequest || cancelFriendRequest;
                            await fn(outgoingReq.id);
                          } catch (err) {
                            alert(err.message || 'Failed to cancel request');
                          }
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-semibold rounded-xl border border-slate-700 transition"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Waiting for user to accept your friend request to enable chat.
                  </p>
                </div>
              );
            }

            if (incomingReq) {
              return (
                <div className="pt-1 flex flex-col items-center justify-center space-y-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Sent you a friend request
                  </span>
                  <button
                    disabled={addingFriendId === targetId}
                    onClick={async () => {
                      setAddingFriendId(targetId);
                      try {
                        await acceptFriendRequest(incomingReq.id);
                      } catch (err) {
                        alert(err.message || 'Failed to accept request');
                      } finally {
                        setAddingFriendId(null);
                      }
                    }}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <span>{addingFriendId === targetId ? 'Accepting...' : 'Accept Friend Request'}</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="pt-2 flex flex-col items-center space-y-1">
                <button
                  disabled={addingFriendId === targetId}
                  onClick={async () => {
                    setAddingFriendId(targetId);
                    try {
                      const fn = onSendFriendRequest || sendFriendRequest;
                      await fn(targetId);
                    } catch (err) {
                      alert(err.message || 'Failed to send request');
                    } finally {
                      setAddingFriendId(null);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <FaUserPlus />
                  <span>{addingFriendId === targetId ? 'Sending Request...' : '+ Add Friend'}</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center pt-0.5">
                  Send a friend request to unlock private chat.
                </p>
              </div>
            );
          })()}
        </div>

        {/* Quick Action Buttons for 1-on-1 */}
        {!isGroup && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition">
              <FaPhone className="text-emerald-400 text-base mb-1.5" />
              <span>Audio Call</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition">
              <FaVideo className="text-blue-400 text-base mb-1.5" />
              <span>Video Call</span>
            </button>
          </div>
        )}

        {/* Description / Status */}
        <div className="space-y-4 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block mb-1 uppercase text-[10px] tracking-wider">
              {isGroup ? 'Group Description' : 'About / Status'}
            </span>
            <p className="text-slate-300 font-medium leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/60">
              {contact.description || contact.status || (isGroup ? 'Group Chat on Pulse-X Messenger' : 'Available on Pulse-X Messenger')}
            </p>
          </div>

          {!isGroup && (
            <div className="flex items-center space-x-3 text-slate-300">
              <FaEnvelope className="text-slate-400 text-sm shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}

          <div className="flex items-center space-x-3 text-slate-300">
            <FaShieldAlt className="text-emerald-400 text-sm shrink-0" />
            <span>End-to-End Encrypted Session</span>
          </div>
        </div>

        {/* GROUP MEMBERS SECTION */}
        {isGroup && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                Group Members ({members.length})
              </span>
            </div>

            {loadingMembers ? (
              <p className="text-xs text-slate-500 text-center py-4">Loading members...</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {members.map((m) => {
                  const isMe = String(m.id) === String(currentUserId);
                  const isAdmin = m.role === 'admin' || String(contact.adminId) === String(m.id);

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <img
                          src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.fullName || m.name)}`}
                          alt={m.fullName || m.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
                        />
                        <div className="truncate">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {isMe ? 'You' : (m.fullName || m.name)}
                            </span>
                            {isAdmin && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-bold rounded-md">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                        </div>
                      </div>

                      {/* Member Actions (Add Friend & Admin Controls) */}
                      {!isMe && (
                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Mini Add Friend button if not friends */}
                          {!friends.some((f) => Number(f.id) === Number(m.id)) && 
                           !outgoingRequests.some((r) => Number(r.receiverId) === Number(m.id)) && (
                            <button
                              disabled={addingFriendId === Number(m.id)}
                              onClick={async () => {
                                setAddingFriendId(Number(m.id));
                                try {
                                  const fn = onSendFriendRequest || sendFriendRequest;
                                  await fn(Number(m.id));
                                } catch (err) {
                                  alert(err.message || 'Failed to send friend request');
                                } finally {
                                  setAddingFriendId(null);
                                }
                              }}
                              title="Add Friend"
                              className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition text-xs flex items-center space-x-1 border border-emerald-500/30"
                            >
                              <FaUserPlus />
                            </button>
                          )}

                          {isCurrentAdmin && (
                            <>
                              <button
                                onClick={() => handleToggleRole(m.id, m.fullName || m.name, m.role)}
                                title={isAdmin ? 'Demote to Member' : 'Promote to Admin'}
                                className="p-1.5 text-amber-400 hover:bg-slate-800 rounded-lg transition text-xs"
                              >
                                <FaShieldVirus />
                              </button>
                              <button
                                onClick={() => handleRemoveMember(m.id, m.fullName || m.name)}
                                title="Remove Member"
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition text-xs"
                              >
                                <FaUserMinus />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS / ACTIONS LIST */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/60 text-xs text-slate-300 font-medium transition">
            <div className="flex items-center space-x-3">
              <FaBell className="text-slate-400 text-sm" />
              <span>Mute Notifications</span>
            </div>
            <input type="checkbox" className="accent-emerald-500 rounded cursor-pointer" />
          </button>

          {isGroup ? (
            <>
              <button
                onClick={() => setConfirmConfig({
                  title: 'Leave Group',
                  message: `Are you sure you want to leave ${contact.name}? You will no longer receive messages from this group.`,
                  confirmText: 'Leave Group',
                  onConfirm: () => {
                    if (onLeaveGroup) onLeaveGroup(contact.id);
                  }
                })}
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition"
              >
                <FaSignOutAlt className="text-sm" />
                <span>Leave Group</span>
              </button>

              {isCurrentAdmin && (
                <button
                  onClick={() => setConfirmConfig({
                    title: 'Delete Group',
                    message: `Are you sure you want to delete ${contact.name}? This action is permanent and deletes all messages for all members.`,
                    confirmText: 'Delete Group',
                    onConfirm: () => {
                      if (onDeleteGroup) onDeleteGroup(contact.id);
                    }
                  })}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition"
                >
                  <FaTrash className="text-sm" />
                  <span>Delete Group</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={() => setConfirmConfig({
                  title: 'Block Contact',
                  message: `Are you sure you want to block ${contact.name}? They will no longer be able to message or call you.`,
                  confirmText: 'Block User',
                  onConfirm: () => alert(`${contact.name} has been blocked.`)
                })} 
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition"
              >
                <FaBan className="text-sm" />
                <span>Block User</span>
              </button>

              <button 
                onClick={() => setConfirmConfig({
                  title: 'Clear Chat History',
                  message: `Are you sure you want to clear chat history with ${contact.name}? This will clear your local view.`,
                  confirmText: 'Clear Chat',
                  onConfirm: () => alert('Chat history cleared.')
                })} 
                className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-500/10 text-xs text-red-400 font-semibold transition"
              >
                <FaTrash className="text-sm" />
                <span>Clear Chat History</span>
              </button>
            </>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirmConfig(null)}
        onConfirm={() => {
          if (confirmConfig?.onConfirm) confirmConfig.onConfirm();
          setConfirmConfig(null);
        }}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        confirmText={confirmConfig?.confirmText}
        confirmVariant="danger"
      />

    </div>
  );
};

export default ContactDrawer;
