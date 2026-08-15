import React, { useState } from 'react';
import { useSettings } from '../../hooks/settings/useSettings';
import { useSettingsForm } from '../../hooks/settings/useSettingsForm';
import { 
  FaUser, 
  FaBell, 
  FaShieldAlt, 
  FaPalette, 
  FaSignOutAlt, 
  FaCheck, 
  FaMoon, 
  FaSun,
  FaCamera,
  FaLock,
  FaVolumeUp,
  FaDesktop
} from 'react-icons/fa';

const SettingsPage = () => {
  const { user, updateProfile, changePassword, revokeAllSessions, logout } = useSettings();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [statusBio, setStatusBio] = useState(user?.status || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setSavedSuccess(false);
    setIsUpdatingProfile(true);

    try {
      await updateProfile(fullName, statusBio);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <FaUser className="text-lg" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Account & App Settings</h2>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>

      {/* BODY CONTENT */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar max-w-4xl space-y-8">
        
        {savedSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center space-x-3 text-xs font-bold animate-fade-in">
            <FaCheck className="text-sm" />
            <span>Your profile preferences have been successfully updated!</span>
          </div>
        )}

        {profileError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center space-x-3 text-xs font-bold">
            <span>{profileError}</span>
          </div>
        )}

        {/* SECTION 1: PROFILE MANAGEMENT */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FaUser className="text-emerald-400" />
            <span>Profile Information</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center space-x-5">
              <div className="relative">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || 'User')}`}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/80 shadow-lg"
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">{user?.fullName}</h4>
                <p className="text-xs text-slate-400">{user?.email || 'user@chatapp.com'}</p>
                <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                  Verified Member
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status Bio</label>
                <input
                  type="text"
                  value={statusBio}
                  onChange={(e) => setStatusBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </section>

        {/* SECTION 2: CHANGE PASSWORD */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FaLock className="text-emerald-400" />
            <span>Security & Password</span>
          </h3>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold">
              Your password has been successfully updated!
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {isChangingPassword ? 'Updating Password...' : 'Update Password'}
            </button>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white">Active Sessions</h4>
                <p className="text-[11px] text-slate-400">Logout from all other browsers and active devices</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to log out from all devices?')) {
                    try {
                      await revokeAllSessions();
                    } catch (err) {
                      alert('Failed to revoke sessions');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition"
              >
                Logout All Devices
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 2: NOTIFICATIONS & SOUND */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FaBell className="text-emerald-400" />
            <span>Notifications & Sound Preferences</span>
          </h3>

          <div className="space-y-4 divide-y divide-slate-800/80">
            
            <div className="flex items-center justify-between pt-3">
              <div>
                <h4 className="text-xs font-bold text-white">Email Notifications</h4>
                <p className="text-[11px] text-slate-400">Receive summary emails when offline</p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6 rounded-full p-1 transition duration-200 ${
                  emailNotifications ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transform transition ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <h4 className="text-xs font-bold text-white">Message Sound Effects</h4>
                <p className="text-[11px] text-slate-400">Play audio chime on new incoming message</p>
              </div>
              <button
                onClick={() => setSoundEffects(!soundEffects)}
                className={`w-12 h-6 rounded-full p-1 transition duration-200 ${
                  soundEffects ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transform transition ${
                  soundEffects ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <h4 className="text-xs font-bold text-white">Read Receipts</h4>
                <p className="text-[11px] text-slate-400">Show double checkmarks when messages are read</p>
              </div>
              <button
                onClick={() => setReadReceipts(!readReceipts)}
                className={`w-12 h-6 rounded-full p-1 transition duration-200 ${
                  readReceipts ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transform transition ${
                  readReceipts ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 3: APPEARANCE & THEME */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FaPalette className="text-emerald-400" />
            <span>Theme & Appearance</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setThemeMode('dark')}
              className={`p-4 rounded-2xl border flex items-center space-x-3 transition ${
                themeMode === 'dark'
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FaMoon className="text-lg text-emerald-400" />
              <div className="text-left">
                <h4 className="text-xs font-bold">Dark Glow Theme</h4>
                <p className="text-[10px] text-slate-400">Sleek dark mode interface</p>
              </div>
            </button>

            <button
              onClick={() => setThemeMode('light')}
              className={`p-4 rounded-2xl border flex items-center space-x-3 transition ${
                themeMode === 'light'
                  ? 'border-emerald-500 bg-emerald-500/10 text-white'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <FaSun className="text-lg text-amber-400" />
              <div className="text-left">
                <h4 className="text-xs font-bold">Light Mode</h4>
                <p className="text-[10px] text-slate-400">Clean bright interface</p>
              </div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default React.memo(SettingsPage);
