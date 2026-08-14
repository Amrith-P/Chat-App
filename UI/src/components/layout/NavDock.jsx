import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaComments, 
  FaCommentAlt, 
  FaUserFriends, 
  FaStar, 
  FaCog, 
  FaMoon, 
  FaSun, 
  FaSignOutAlt 
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const NavDock = ({ unreadCount = 0, hideMobileNav = false }) => {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);

  const navItems = [
    { id: 'chats', label: 'Chats', icon: FaCommentAlt, badge: unreadCount > 0 ? unreadCount : null },
    //{ id: 'contacts', label: 'Contacts', icon: FaUserFriends, badge: null },
    { id: 'starred', label: 'Starred', icon: FaStar, badge: null },
    { id: 'settings', label: 'Settings', icon: FaCog, badge: null },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (md and above) */}
      <aside className="hidden md:flex w-16 lg:w-20 bg-slate-900 border-r border-slate-800/80 flex-col justify-between items-center py-5 shrink-0 z-20 select-none">
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center space-y-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition duration-300 transform hover:scale-105 cursor-pointer">
            <FaComments className="text-2xl text-slate-950" />
          </div>

          <div className="w-8 h-[1px] bg-slate-800" />

          {/* Navigation Items */}
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={`/app/${item.id}`}
                  title={item.label}
                  className={({ isActive }) => `relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`text-xl transition ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                      {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-sm">
                          {item.badge}
                        </span>
                      )}
                      <span className="absolute left-16 bg-slate-800 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 flex items-center justify-center transition"
          >
            {darkMode ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
          </button>

          <div className="relative group cursor-pointer">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || 'User')}`}
              alt={user?.fullName}
              className="w-10 h-10 rounded-xl border-2 border-emerald-500/60 object-cover shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
            <div className="absolute left-16 bottom-0 bg-slate-800 text-white text-xs p-2 rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none min-w-[140px] z-50 shadow-xl border border-slate-700">
              <p className="font-bold">{user?.fullName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition"
          >
            <FaSignOutAlt className="text-lg" />
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (below md - hidden when active chat is open) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 items-center justify-around px-2 z-40 select-none ${
        hideMobileNav ? 'hidden' : 'flex'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={`/app/${item.id}`}
              className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="text-lg" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Mobile Profile & Logout Trigger */}
        <button
          onClick={logout}
          title="Log Out"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-red-400"
        >
          <FaSignOutAlt className="text-lg" />
          <span className="text-[10px] mt-0.5 font-medium">Log Out</span>
        </button>
      </div>
    </>
  );
};

export default NavDock;
