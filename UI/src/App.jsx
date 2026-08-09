import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import ChatScreen from './components/chat/ChatScreen';

const MainContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading ChatApp Pro...</p>
      </div>
    );
  }

  return user ? <ChatScreen /> : <AuthPage />;
};

const App = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;