import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaUsers, FaSearch, FaCheck, FaArrowRight, FaArrowLeft, FaCamera } from 'react-icons/fa';
import { apiRequest } from '../../api/client';

const GROUP_AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/identicon/svg?seed=ProjectTeam',
  'https://api.dicebear.com/7.x/identicon/svg?seed=FriendsAndFamily',
  'https://api.dicebear.com/7.x/identicon/svg?seed=DevelopersHub',
  'https://api.dicebear.com/7.x/identicon/svg?seed=GamingSquad',
  'https://api.dicebear.com/7.x/identicon/svg?seed=DesignCrew',
  'https://api.dicebear.com/7.x/identicon/svg?seed=MarketingHub'
];

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, conversations = [] }) => {
  const [step, setStep] = useState(1); // 1: Group Info, 2: Select Members
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState(GROUP_AVATAR_PRESETS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchMemberTerm, setSearchMemberTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract unique contacts from existing conversations
  const existingContacts = useMemo(() => {
    const contactsMap = new Map();
    conversations.forEach((c) => {
      if (c.contactId && !c.isGroup) {
        contactsMap.set(c.contactId, {
          id: c.contactId,
          name: c.name,
          email: c.email,
          avatar: c.avatar
        });
      }
    });
    return Array.from(contactsMap.values());
  }, [conversations]);

  // Fetch registered users on search term change
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setIsSearching(true);
      try {
        const queryParam = searchMemberTerm.trim() ? `?search=${encodeURIComponent(searchMemberTerm.trim())}` : '';
        const res = await apiRequest(`/users${queryParam}`, 'GET');
        const users = res.users || [];
        setAvailableUsers(users);
      } catch (err) {
        console.error('Failed to search users for group creation:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [isOpen, searchMemberTerm]);

  // Combined list of users (contacts first, then searched users)
  const displayUserList = useMemo(() => {
    const combined = new Map();
    existingContacts.forEach((u) => combined.set(u.id, u));
    availableUsers.forEach((u) => combined.set(u.id, u));
    
    const list = Array.from(combined.values());

    if (!searchMemberTerm.trim()) return list;

    const term = searchMemberTerm.toLowerCase().trim();
    return list.filter(
      (u) =>
        (u.name || u.fullName || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
    );
  }, [existingContacts, availableUsers, searchMemberTerm]);

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setGroupName('');
      setDescription('');
      setAvatar(GROUP_AVATAR_PRESETS[0]);
      setSelectedMemberIds([]);
      setSearchMemberTerm('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMemberSelection = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleNextStep = () => {
    if (!groupName.trim()) {
      setErrorMsg('Please enter a group name');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleSubmitGroup = async () => {
    if (selectedMemberIds.length === 0) {
      setErrorMsg('Please select at least 1 member for the group');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onCreateGroup({
        name: groupName.trim(),
        description: description.trim(),
        avatar,
        memberIds: selectedMemberIds
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2 text-emerald-400">
            <FaUsers className="text-xl" />
            <h2 className="font-bold text-white text-base">
              {step === 1 ? 'Create New Group' : 'Add Group Members'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Group Name, Description & Avatar */
            <div className="space-y-5">
              
              {/* Group Avatar Preview & Selector */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative group">
                  <img
                    src={avatar}
                    alt="Group Avatar"
                    className="w-20 h-20 rounded-full border-2 border-emerald-500/50 p-1 object-cover shadow-lg bg-slate-800"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <FaCamera className="text-white text-base" />
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium">Select Group Icon Avatar</span>

                {/* Preset Avatars Bar */}
                <div className="flex space-x-2 pt-1">
                  {GROUP_AVATAR_PRESETS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-8 h-8 rounded-full border-2 transition p-0.5 ${
                        avatar === presetUrl ? 'border-emerald-500 scale-110' : 'border-transparent hover:border-slate-700 opacity-70'
                      }`}
                    >
                      <img src={presetUrl} alt="Preset" className="w-full h-full rounded-full bg-slate-800" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Name Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Group Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project Team, Family & Friends"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={100}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="Discuss project updates and general announcements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none custom-scrollbar"
                />
              </div>

            </div>
          ) : (
            /* STEP 2: Select Members */
            <div className="space-y-4">
              
              {/* Search Field */}
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-3 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search contacts or users by name..."
                  value={searchMemberTerm}
                  onChange={(e) => setSearchMemberTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Selected Count Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                <span>Selected Members:</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedMemberIds.length} selected
                </span>
              </div>

              {/* Member Selection List */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {displayUserList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    {isSearching ? 'Searching users...' : 'No users found'}
                  </div>
                ) : (
                  displayUserList.map((u) => {
                    const isSelected = selectedMemberIds.includes(u.id);
                    const userName = u.name || u.fullName || 'User';

                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleMemberSelection(u.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                          isSelected ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`}
                            alt={userName}
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-700"
                          />
                          <div className="truncate">
                            <h4 className="text-xs font-semibold text-white truncate">{userName}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>

                        {/* Checkbox Indicator */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                            isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-700 bg-slate-900'
                          }`}
                        >
                          {isSelected && <FaCheck className="text-xs stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-400 transition"
            >
              Cancel
            </button>
          )}

          {step === 1 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <span>Next: Add Members</span>
              <FaArrowRight />
            </button>
          ) : (
            <button
              onClick={handleSubmitGroup}
              disabled={isSubmitting || selectedMemberIds.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <span>Creating Group...</span>
              ) : (
                <>
                  <FaCheck />
                  <span>Create Group</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateGroupModal;
