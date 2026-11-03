import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Dices,
  Users,
  Volume2,
  VolumeX,
  ChevronDown,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { UserProfile, PREDEFINED_AVATARS } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { sounds } from '../utils/audio';
import { usePWAInstall } from '../utils/usePWAInstall';

interface NavbarProps {
  user: UserProfile | null;
  onOpenWallet: (tab?: 'deposit' | 'withdraw' | 'history') => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onSignOut?: () => void;
  onlineCount?: number;
  onOpenApkGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenWallet,
  onOpenProfile,
  onOpenAdmin,
  onOpenAuth,
  onSignOut,
  onlineCount = 1432,
  onOpenApkGuide,
}) => {
  const { isInstallable, install } = usePWAInstall();
  const [currencyUnit, setCurrencyUnit] = useState<'USD' | 'INR' | 'USDT' | 'BTC'>('INR');
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());

  const avatar = user
    ? PREDEFINED_AVATARS.find((a) => a.id === user.avatarId) || PREDEFINED_AVATARS[0]
    : null;

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playCoinDing();
  };

  const formatBalance = (usd: number) => {
    if (currencyUnit === 'INR') {
      const inr = usd * 86.5;
      return `₹${inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currencyUnit === 'BTC') {
      const btc = usd / 92000;
      return `${btc.toFixed(6)} BTC`;
    }
    if (currencyUnit === 'USDT') {
      return `${usd.toFixed(2)} USDT`;
    }
    return `$${usd.toFixed(2)}`;
  };

  const cycleCurrency = () => {
    if (currencyUnit === 'INR') setCurrencyUnit('USD');
    else if (currencyUnit === 'USD') setCurrencyUnit('USDT');
    else if (currencyUnit === 'USDT') setCurrencyUnit('BTC');
    else setCurrencyUnit('INR');
    sounds.playChip();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-300/40 text-slate-950">
            <Dices className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                Small Casino
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <Users className="w-3 h-3 text-emerald-400" />
              <span>{onlineCount.toLocaleString()} live players</span>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Real Balance Display */}
              <div className="flex items-center rounded-2xl bg-slate-900 border border-slate-800 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={cycleCurrency}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                  title="Click to toggle currency view (USD / USDT / BTC)"
                >
                  <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-0.5">
                      <span>Wallet Balance</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </div>
                    <div className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                      {formatBalance(user.balance)}
                    </div>
                  </div>
                </button>

                {/* Quick Cashier Buttons */}
                <div className="flex items-center gap-1 pl-1 pr-1 border-l border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenWallet('deposit')}
                    className="px-2 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
                    title="Instant Deposit"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Deposit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenWallet('withdraw')}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Withdraw (Min $3, 24h Queue)"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Withdraw</span>
                  </button>
                </div>
              </div>

              {/* Notification Center */}
              <NotificationCenter onOpenWallet={() => onOpenWallet('history')} />

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className="hidden sm:flex p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>

              {/* Admin Sign Out Button */}
              {user.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playChip();
                    if (onSignOut) onSignOut();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40"
                  title="Sign Out of Master Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin Sign Out</span>
                </button>
              )}

              {/* Install PWA/APK quick button */}
              {isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-950/30"
                  title="Install Small Casino as Native Android App"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Install App</span>
                </button>
              ) : onOpenApkGuide ? (
                <button
                  type="button"
                  onClick={onOpenApkGuide}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  title="Download Android APK & Installation Options"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Get APK</span>
                </button>
              ) : null}

              {/* Admin Portal Button */}
              {user.isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="px-2.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Open Admin Validation Portal"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Admin Queue</span>
                </button>
              )}

              {/* User Profile Pill */}
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 sm:pr-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer group"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base bg-gradient-to-tr ${
                    avatar?.bgGradient || 'from-amber-500 to-yellow-600'
                  } shadow-md group-hover:scale-105 transition-transform`}
                >
                  {avatar?.emoji || '👑'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[90px]">
                    {user.username}
                  </div>
                  <div className="text-[9px] text-amber-400/90 font-semibold uppercase">
                    Profile
                  </div>
                </div>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Sign Up ($0.10 Bonus)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
