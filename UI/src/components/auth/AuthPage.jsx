import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FaComments, 
  FaLock, 
  FaEnvelope, 
  FaUser, 
  FaEye, 
  FaEyeSlash, 
  FaSignInAlt, 
  FaUserPlus, 
  FaKey, 
  FaArrowLeft, 
  FaShieldAlt, 
  FaBolt, 
  FaMagic,
  FaCheck,
  FaSyncAlt,
  FaTimes,
  FaThLarge,
  FaPlus,
  FaMale,
  FaFemale,
  FaSmileBeam
} from 'react-icons/fa';

// 24 Curated Smiling Male & Female Avatars
const SMILING_AVATARS = [
  // MALE SMILING AVATARS (12)
  { id: 'm1', gender: 'male', name: 'Alex', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexSmile&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm2', gender: 'male', name: 'David', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidHappy&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm3', gender: 'male', name: 'James', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesJoy&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm4', gender: 'male', name: 'Ethan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EthanSmirk&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm5', gender: 'male', name: 'Lucas', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LucasCheerful&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm6', gender: 'male', name: 'Noah', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NoahBright&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm7', gender: 'male', name: 'Oliver', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OliverSunny&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm8', gender: 'male', name: 'Liam', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LiamGleeful&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm9', gender: 'male', name: 'Benjamin', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BenjaminBeam&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm10', gender: 'male', name: 'Mason', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MasonDelight&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm11', gender: 'male', name: 'Logan', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LoganRadiant&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'm12', gender: 'male', name: 'Jacob', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JacobJolly&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },

  // FEMALE SMILING AVATARS (12)
  { id: 'f1', gender: 'female', name: 'Emma', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmmaSmile&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f2', gender: 'female', name: 'Sophia', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SophiaHappy&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f3', gender: 'female', name: 'Olivia', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OliviaJoy&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f4', gender: 'female', name: 'Ava', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AvaCheerful&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f5', gender: 'female', name: 'Isabella', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IsabellaBright&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f6', gender: 'female', name: 'Mia', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MiaSunny&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f7', gender: 'female', name: 'Amelia', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AmeliaGleeful&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f8', gender: 'female', name: 'Harper', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HarperBeam&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f9', gender: 'female', name: 'Evelyn', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EvelynDelight&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f10', gender: 'female', name: 'Abigail', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AbigailRadiant&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f11', gender: 'female', name: 'Emily', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmilyJolly&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
  { id: 'f12', gender: 'female', name: 'Ella', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EllaSparkle&mouth=smile,laughing,twinkle&eyebrows=defaultHappy&eyes=happy' },
];

const AuthPage = () => {
  const { login, register, forgotPassword, resetPassword, error, setError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Avatar Selection States
  const [selectedAvatar, setSelectedAvatar] = useState(SMILING_AVATARS[0].url);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState('all'); // 'all' | 'male' | 'female'

  // Form States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    resetToken: '',
    newPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage('');
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Demo Login
  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      try {
        await login('alex.demo@chatapp.com', 'password123');
      } catch (loginErr) {
        await register('Alex Morgan (Demo)', 'alex.demo@chatapp.com', 'password123');
      }
    } catch (err) {
      setError('Demo login failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all registration fields.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(formData.fullName, formData.email, formData.password, selectedAvatar);
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password Submission
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setError('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword(formData.email);
      setSuccessMessage(res.message);
      if (res.resetToken) {
        setFormData((prev) => ({ ...prev, resetToken: res.resetToken }));
        setMode('reset');
      }
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password Submission
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.resetToken || !formData.newPassword) {
      setError('Please fill in all fields to reset password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(formData.email, formData.resetToken, formData.newPassword);
      setSuccessMessage(res.message);
      setTimeout(() => {
        setMode('login');
      }, 2000);
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* LEFT SECTION - Hero Presentation (Desktop Only) */}
      <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 lg:p-16 flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Glow Spheres */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center space-x-3 mb-6 md:mb-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <FaComments className="text-xl sm:text-2xl text-slate-950" />
          </div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            ChatApp Pro
          </span>
        </div>

        {/* Hero Middle Feature Presentation */}
        <div className="relative z-10 my-auto py-4 sm:py-8">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3 sm:mb-6">
            Real-time conversations, <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Elevated Experience.
            </span>
          </h1>

          <p className="text-slate-400 text-xs sm:text-lg mb-4 sm:mb-8 max-w-md">
            Connect instantly with friends, family, and colleagues in a modern, secure environment.
          </p>

          {/* Feature List */}
          <div className="hidden sm:space-y-4 max-w-md sm:block">
            <div className="flex items-center space-x-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800/80">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <FaBolt className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Instant Messaging</h3>
                <p className="text-sm text-slate-400">Powered by Socket.IO real-time websockets.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800/80">
              <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400">
                <FaShieldAlt className="text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure JWT Authentication</h3>
                <p className="text-sm text-slate-400">Encrypted token validation & safe passwords.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-500 pt-4 sm:pt-6 border-t border-slate-800/60 hidden sm:block">
          © 2026 ChatApp Pro. All rights reserved.
        </div>
      </div>

      {/* RIGHT SECTION - Auth Form Card */}
      <div className="w-full md:w-1/2 bg-slate-950 p-6 md:p-12 lg:p-16 flex items-center justify-center relative">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile Only Brand Header */}
          <div className="flex md:hidden items-center justify-center space-x-3 mb-2 pt-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FaComments className="text-xl text-slate-950" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              ChatApp Pro
            </span>
          </div>

          {/* Header Title */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'forgot' && 'Reset Your Password'}
              {mode === 'reset' && 'Enter Reset Details'}
            </h2>
            <p className="text-slate-400 text-sm">
              {mode === 'login' && 'Sign in to access your chats and messages'}
              {mode === 'register' && 'Join ChatApp today and start messaging'}
              {mode === 'forgot' && "Enter your email and we'll help you reset your password"}
              {mode === 'reset' && 'Provide your reset code and new password'}
            </p>
          </div>

          {/* Navigation Mode Switcher Bar */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login' || mode === 'forgot' || mode === 'reset'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('register')}
              className={`py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-2 font-bold hover:text-white">✕</button>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
              {successMessage}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-xs text-emerald-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                <FaSignInAlt />
              </button>

              {/* Quick Demo Login */}
              
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* AVATAR SELECTION PICKER */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <FaSmileBeam className="text-amber-400 text-sm" />
                    <span>Choose Smiling Avatar</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="flex items-center space-x-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition border border-emerald-500/20"
                  >
                    <FaThLarge className="text-[10px]" />
                    <span>More Avatars +</span>
                  </button>
                </div>

                {/* Selected Avatar Preview + Quick Thumbnails */}
                <div className="flex items-center space-x-3">
                  <div className="relative shrink-0">
                    <img
                      src={selectedAvatar}
                      alt="Selected Avatar"
                      className="w-14 h-14 rounded-full border-2 border-emerald-500 bg-slate-950 object-cover shadow-lg shadow-emerald-500/20"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-1 shadow">
                      <FaCheck className="text-[9px]" />
                    </span>
                  </div>

                  {/* Thumbnail Choices Grid */}
                  <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar py-1">
                    {SMILING_AVATARS.slice(0, 4).map((av) => {
                      const isSelected = selectedAvatar === av.url;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.url)}
                          className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 transition transform hover:scale-110 flex items-center justify-center bg-slate-950 ${
                            isSelected
                              ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105'
                              : 'border-slate-800 opacity-70 hover:opacity-100'
                          }`}
                          title={`${av.name} (${av.gender})`}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}

                    {/* View All Button Thumbnail */}
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-500/60 bg-emerald-500/10 text-emerald-400 flex flex-col items-center justify-center hover:bg-emerald-500/20 transition shrink-0"
                      title="View all 24 smiling avatars"
                    >
                      <FaPlus className="text-xs" />
                      <span className="text-[8px] font-bold">24+</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <FaUser className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* Password Strength Indicator Bar */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={`font-bold ${
                        formData.password.length < 6
                          ? 'text-red-400'
                          : formData.password.length < 10
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {formData.password.length < 6
                          ? 'Weak (min 6 chars)'
                          : formData.password.length < 10
                          ? 'Good'
                          : 'Strong 💪'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex space-x-1 p-0.5 border border-slate-800">
                      <div className={`h-full rounded-full transition-all duration-300 ${
                        formData.password.length > 0 ? (formData.password.length < 6 ? 'w-1/3 bg-red-500' : formData.password.length < 10 ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-500') : 'w-0'
                      }`} />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                <FaUserPlus />
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your registered email"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Code'}</span>
                <FaKey />
              </button>

              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="w-full py-2.5 text-sm text-slate-400 hover:text-white flex items-center justify-center space-x-2"
              >
                <FaArrowLeft />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reset Code</label>
                <input
                  type="text"
                  name="resetToken"
                  value={formData.resetToken}
                  onChange={handleChange}
                  placeholder="Reset token"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono uppercase tracking-widest text-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                <span>{isSubmitting ? 'Updating Password...' : 'Set New Password'}</span>
                <FaLock />
              </button>
            </form>
          )}

        </div>
      </div>

      {/* 4. AVATAR SELECTION MODAL POPUP (24 SMILING AVATARS) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FaSmileBeam className="text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <span>Choose Smiling Avatar</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-extrabold">24 Options</span>
                  </h3>
                  <p className="text-xs text-slate-400">Select a cheerful smiling avatar for your profile</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Gender Filter Tabs */}
            <div className="flex items-center space-x-2 py-3.5 shrink-0 border-b border-slate-800/60">
              <button
                type="button"
                onClick={() => setAvatarFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  avatarFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FaThLarge className="text-xs" />
                <span>All (24)</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarFilter('male')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  avatarFilter === 'male'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FaMale className="text-xs" />
                <span>Male Smiling (12)</span>
              </button>
              <button
                type="button"
                onClick={() => setAvatarFilter('female')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  avatarFilter === 'female'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FaFemale className="text-xs" />
                <span>Female Smiling (12)</span>
              </button>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 py-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {SMILING_AVATARS.filter((a) => avatarFilter === 'all' || a.gender === avatarFilter).map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(av.url);
                      setIsAvatarModalOpen(false);
                    }}
                    className={`group relative p-2.5 rounded-2xl border-2 transition flex flex-col items-center justify-center space-y-1.5 bg-slate-950/60 hover:bg-slate-800/80 ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-500/40 bg-emerald-500/10'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-slate-700 bg-slate-900 group-hover:scale-105 transition">
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <span className="bg-emerald-500 text-slate-950 rounded-full p-1 shadow-lg">
                            <FaCheck className="text-xs" />
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white flex items-center space-x-1">
                      <span>{av.name}</span>
                      {av.gender === 'male' ? (
                        <FaMale className="text-[10px] text-blue-400" />
                      ) : (
                        <FaFemale className="text-[10px] text-pink-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">All avatars are smiling and happy 😊</span>
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AuthPage;
