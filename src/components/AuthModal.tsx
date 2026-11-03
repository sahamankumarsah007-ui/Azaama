import React, { useState } from 'react';
import { ShieldCheck, Sparkles, User, Lock, Mail, ArrowRight, Dices, Coins, KeyRound, ShieldAlert } from 'lucide-react';
import { PREDEFINED_AVATARS, WELCOME_BONUS_USD, UserProfile } from '../types';
import { createNewUser, getStoredUsers, setCurrentUser, DEFAULT_ADMIN, ADMIN_PASSWORD, ADMIN_SECURITY_CODE } from '../utils/storage';
import { sounds } from '../utils/audio';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  isOpen?: boolean;
  onClose?: () => void;
  initialMode?: 'signup' | 'login' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  onClose,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signup' | 'login' | 'admin'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PREDEFINED_AVATARS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      try {
        if (mode === 'admin') {
          // Strictly verify 2-factor Admin login:
          // Password: "Amankumar007", 4-digit code: "0079"
          if (password !== ADMIN_PASSWORD || adminCode.trim() !== ADMIN_SECURITY_CODE) {
            setError('Invalid Admin Password or 4-digit Security Code! Access Denied.');
            setIsLoading(false);
            return;
          }

          setCurrentUser(DEFAULT_ADMIN);
          sounds.playJackpot();
          onSuccess(DEFAULT_ADMIN);
          if (onClose) onClose();
          return;
        }

        if (mode === 'signup') {
          if (!username.trim()) {
            setError('Please enter a display username');
            setIsLoading(false);
            return;
          }
          if (username.trim().length < 3) {
            setError('Username must be at least 3 characters');
            setIsLoading(false);
            return;
          }

          // Email ID is strictly required and only 1 sign-up allowed per email ID
          if (!email.trim()) {
            setError('Email ID is mandatory for account registration.');
            setIsLoading(false);
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address (e.g. name@domain.com)');
            setIsLoading(false);
            return;
          }

          const existing = getStoredUsers();
          const normalizedEmail = email.trim().toLowerCase();
          const emailAlreadyExists = Object.values(existing).some(
            (u) => u.email && u.email.toLowerCase() === normalizedEmail
          );
          if (emailAlreadyExists) {
            setError('This email ID is already registered! Only 1 account and 1 bonus per email. Please log in.');
            setIsLoading(false);
            return;
          }

          const usernameTaken = Object.values(existing).some(
            (u) => u.username.toLowerCase() === username.trim().toLowerCase()
          );
          if (usernameTaken) {
            setError('This username is already taken. Try another.');
            setIsLoading(false);
            return;
          }

          if (!password || password.length < 4) {
            setError('Please choose a password with at least 4 characters');
            setIsLoading(false);
            return;
          }

          const newUser = createNewUser(username, email, selectedAvatar, password);
          sounds.playWin();
          onSuccess(newUser);
          if (onClose) onClose();
        } else {
          // Player login mode
          const existing = getStoredUsers();
          const identifier = username.trim().toLowerCase();
          const found = Object.values(existing).find(
            (u) =>
              u.username.toLowerCase() === identifier ||
              (u.email && u.email.toLowerCase() === identifier)
          );

          if (!found) {
            setError('Account not found. Please verify your username or registered email.');
            setIsLoading(false);
            return;
          }

          if (found.passwordHash && password && found.passwordHash !== password) {
            setError('Incorrect password. Please try again.');
            setIsLoading(false);
            return;
          }

          setCurrentUser(found);
          sounds.playCoinDing();
          onSuccess(found);
          if (onClose) onClose();
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] p-6 sm:p-8 text-white animate-in zoom-in-95 duration-200">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.6)] border-4 border-slate-950">
          <Dices className="w-10 h-10 text-slate-950 animate-bounce" />
        </div>

        <div className="text-center mt-6 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Provably Fair • Licensed in UK & Malta</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Small Casino
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Live Cricket Sports Betting, Slots, Blackjack, Poker & Arcade
          </p>

          {mode !== 'admin' && (
            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-amber-300">
              <Coins className="w-5 h-5 text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>New Players receive <span className="text-emerald-400 font-extrabold text-base">${WELCOME_BONUS_USD.toFixed(2)} USD (₹{(WELCOME_BONUS_USD * 86.5).toFixed(0)} INR)</span> Bonus!</span>
            </div>
          )}
        </div>

        {/* 3 Tab Switcher */}
        <div className="flex p-1 mb-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Player Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'admin'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'admin' ? (
            /* ADMIN 2-FACTOR LOGIN */
            <div className="space-y-4 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Admin Master Two-Factor Authentication</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Exclusive control portal for approvals, user balance adjustments, and platform verification.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Master Password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Admin Password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  4-Digit Security PIN Code:
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="4-digit code (e.g. 0079)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm font-mono tracking-widest text-center"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD PLAYER SIGNUP / LOGIN */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {mode === 'signup' ? 'Choose Username' : 'Username or Email'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === 'signup' ? 'e.g. LuckyAce777' : 'Enter username or email'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Email ID (Mandatory):</span>
                    <span className="text-[10px] text-amber-400 font-normal">1 Sign-Up & Bonus per Email</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password (Min 4 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Choose Casino Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PREDEFINED_AVATARS.map((av) => {
                      const isSelected = selectedAvatar === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.id)}
                          className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-400 bg-amber-500/20 scale-105 shadow-md shadow-amber-500/20'
                              : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-tr ${av.bgGradient} shadow-inner`}>
                            {av.emoji}
                          </div>
                          <span className="text-[10px] font-medium text-slate-300 truncate w-full text-center">
                            {av.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-2 py-3.5 px-4 rounded-xl font-black text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
              mode === 'admin'
                ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white shadow-rose-900/40 hover:brightness-110'
                : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/25'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'admin'
                    ? 'Verify & Enter Admin Portal'
                    : mode === 'signup'
                    ? 'Create Account & Claim Bonus'
                    : 'Sign In To Play'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            {mode === 'signup' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="hover:text-amber-300 text-slate-400 underline cursor-pointer"
              >
                Already have an account? Log in
              </button>
            ) : mode === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="hover:text-amber-300 text-slate-400 underline cursor-pointer"
              >
                Need an account? Sign Up
              </button>
            ) : (
              <span className="text-slate-500">Master 2FA Verification</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setMode('admin');
              setError(null);
            }}
            className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Admin (2FA)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
