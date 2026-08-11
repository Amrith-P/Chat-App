import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const { user, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || 'Amrith P');
  const [statusBio, setStatusBio] = useState(user?.status || 'Building ChatApp Pro ✨');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`}
                  alt={fullName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/80 shadow-lg"
                />
                <button
                  type="button"
                  title="Change Avatar"
                  className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-slate-950 rounded-full shadow-lg hover:bg-emerald-400 transition"
                >
                  <FaCamera className="text-xs" />
                </button>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">{fullName}</h4>
                <p className="text-xs text-slate-400">{user?.email || 'user@chatapp.com'}</p>
                <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                  Pro Account Active
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
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              Save Profile Changes
            </button>
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

export default SettingsPage;
