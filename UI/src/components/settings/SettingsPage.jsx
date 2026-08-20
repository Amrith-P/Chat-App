import React, { useState } from 'react';
import { 
  FaCog, 
  FaShieldAlt, 
  FaLock, 
  FaUser, 
  FaCommentAlt, 
  FaBell, 
  FaPalette, 
  FaDatabase, 
  FaQuestionCircle, 
  FaChevronRight, 
  FaSignOutAlt, 
  FaMoon, 
  FaVolumeUp, 
  FaKey, 
  FaEye, 
  FaFileExport, 
  FaTrashAlt, 
  FaInfoCircle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, setTheme, isDark } = useTheme();

  // Settings UI states (mock / UI presentation only per request)
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const settingsCategories = [
    {
      title: 'Account Settings',
      icon: FaUser,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      items: [
        { id: 'acc-email', label: 'Email Address', value: user?.email || 'user@pulsex.com', type: 'value' },
        { id: 'acc-status', label: 'Account Status', value: 'Verified', badge: 'Active', type: 'badge' },
        { id: 'acc-password', label: 'Change Password', value: 'Last changed 30 days ago', type: 'arrow' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: FaShieldAlt,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      items: [
        { 
          id: 'priv-2fa', 
          label: 'Two-Factor Authentication (2FA)', 
          desc: 'Add an extra layer of security to your account',
          type: 'toggle', 
          state: twoFactor, 
          onToggle: () => setTwoFactor(!twoFactor) 
        },
        { 
          id: 'priv-receipts', 
          label: 'Read Receipts', 
          desc: 'Show double checkmarks when messages are read',
          type: 'toggle', 
          state: readReceipts, 
          onToggle: () => setReadReceipts(!readReceipts) 
        },
        { id: 'priv-lastseen', label: 'Last Seen & Online Status', value: 'Everyone', type: 'arrow' },
        { id: 'priv-blocked', label: 'Blocked Contacts', value: '0 users', type: 'arrow' }
      ]
    },
    {
      title: 'Chats & Media',
      icon: FaCommentAlt,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      items: [
        { id: 'chat-wallpaper', label: 'Chat Wallpaper & Theme', value: 'Default Slate Dark', type: 'arrow' },
        { id: 'chat-font', label: 'Font Size', value: 'Medium', type: 'arrow' },
        { id: 'chat-export', label: 'Export Chat History', value: 'Download ZIP archive', type: 'arrow' },
        { id: 'chat-clear', label: 'Clear All Chat Messages', value: 'Permanently remove history', type: 'arrow', danger: true }
      ]
    },
    {
      title: 'Notifications & Sound',
      icon: FaBell,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      items: [
        { 
          id: 'notif-push', 
          label: 'Message Notifications', 
          desc: 'Receive instant push alerts for incoming messages',
          type: 'toggle', 
          state: notifications, 
          onToggle: () => setNotifications(!notifications) 
        },
        { id: 'notif-sound', label: 'Notification Sounds', value: 'Chime (Default)', type: 'arrow' },
        { id: 'notif-preview', label: 'Message Previews', value: 'Show Name & Content', type: 'arrow' }
      ]
    },
    {
      title: 'Appearance',
      icon: FaPalette,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      items: [
        { 
          id: 'app-theme', 
          label: 'Dark Mode', 
          desc: isDark ? 'Sleek dark mode active' : 'Clean light mode active',
          type: 'toggle', 
          state: isDark, 
          onToggle: toggleTheme 
        },
        { id: 'app-accent', label: 'Accent Color', value: 'Emerald Green', type: 'arrow' }
      ]
    },
    {
      title: 'Help & About',
      icon: FaQuestionCircle,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
      items: [
        { id: 'help-center', label: 'Help Center & FAQ', type: 'arrow' },
        { id: 'help-terms', label: 'Terms of Service & Privacy Policy', type: 'arrow' },
        { id: 'help-version', label: 'App Version', value: 'v1.0.5 Pro Build', type: 'value' }
      ]
    }
  ];

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <FaCog className="text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Settings</h2>
            <p className="text-[11px] text-slate-400">Manage privacy, notifications, appearance, and account preferences</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>

      {/* BODY CONTENT - SETTINGS LIST CATEGORIES */}
      <div className="p-6 flex-1 overflow-y-auto custom-scrollbar max-w-4xl space-y-6">
        
        {settingsCategories.map((category) => {
          const CategoryIcon = category.icon;

          return (
            <section 
              key={category.title}
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl"
            >
              {/* Category Header */}
              <div className="flex items-center space-x-3 pb-2 border-b border-slate-800/80">
                <div className={`p-2 rounded-xl ${category.bgColor} ${category.color}`}>
                  <CategoryIcon className="text-base" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">{category.title}</h3>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-800/60">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between group hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer"
                  >
                    <div className="pr-4 min-w-0">
                      <h4 className={`text-xs font-semibold ${item.danger ? 'text-red-400' : 'text-slate-200 group-hover:text-white'} transition`}>
                        {item.label}
                      </h4>
                      {item.desc && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                      )}
                    </div>

                    {/* Right Action / Control */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {item.type === 'toggle' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.onToggle) item.onToggle();
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition duration-200 ${
                            item.state ? 'bg-emerald-500' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-slate-950 transform transition ${
                            item.state ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      )}

                      {item.type === 'badge' && (
                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}

                      {item.type === 'value' && (
                        <span className="text-xs font-mono text-slate-400">{item.value}</span>
                      )}

                      {item.type === 'arrow' && (
                        <div className="flex items-center space-x-2 text-xs text-slate-400 group-hover:text-slate-200 transition">
                          {item.value && <span className="text-[11px] font-medium text-slate-400">{item.value}</span>}
                          <FaChevronRight className="text-[10px] text-slate-500 group-hover:text-emerald-400 transition" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      </div>
    </div>
  );
};

export default React.memo(SettingsPage);
