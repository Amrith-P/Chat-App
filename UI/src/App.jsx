import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { CallProvider } from './context/CallContext';
import { StarredProvider } from './context/StarredContext';
import AuthPage from './components/auth/AuthPage';
import ChatScreen from './components/chat/ChatScreen';

import ContactsPage from './components/contacts/ContactsPage';
import CallsPage from './components/calls/CallsPage';
import StarredPage from './components/starred/StarredPage';
import SettingsPage from './components/settings/SettingsPage';
import ProfilePage from './components/profile/ProfilePage';
import IncomingCallModal from './components/call/IncomingCallModal';
import CallModal from './components/chat/CallModal';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading ChatApp Pro...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/app/chats" replace /> : children;
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <CallProvider>
              <StarredProvider>
                <Routes>
                  {/* Base redirect */}
                  <Route path="/" element={<Navigate to="/app/chats" replace />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<AuthRoute><AuthPage /></AuthRoute>} />
                  <Route path="/register" element={<AuthRoute><AuthPage /></AuthRoute>} />

                  {/* Protected App Routes */}
                  <Route path="/app" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/app/chats" replace />} />
                    <Route path="chats" element={<div id="chat-tab-placeholder"></div>} />
                    <Route path="chats/:chatId" element={<div id="chat-tab-placeholder"></div>} />
                    <Route path="contacts" element={<ContactsPage />} />
                    <Route path="calls" element={<CallsPage />} />
                    <Route path="starred" element={<StarredPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                  </Route>
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>

                {/* Global Real-Time Call Modals */}
                <IncomingCallModal />
                <CallModal />
              </StarredProvider>
            </CallProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;