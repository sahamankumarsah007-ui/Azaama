import React, { useState, useEffect } from 'react';
import {
  Dices,
  Flame,
  Trophy,
  Users,
  History,
  Wallet,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Gift,
  Zap,
  Radio,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile, WELCOME_BONUS_USD } from './types';
import { getCurrentUser, setCurrentUser } from './utils/storage';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminPanel } from './components/AdminPanel';
import { MultiplayerDashboard } from './components/MultiplayerDashboard';
import { TournamentsView } from './components/TournamentsView';
import { LeaderboardView } from './components/LeaderboardView';
import { ActivityHistory } from './components/ActivityHistory';
import { CricketBetting } from './components/CricketBetting';
import { ApkGuideModal } from './components/ApkGuideModal';

// Games
import { SlotsGame } from './components/games/SlotsGame';
import { BlackjackGame } from './components/games/BlackjackGame';
import { PokerGame } from './components/games/PokerGame';
import { RouletteGame } from './components/games/RouletteGame';
import { CrashGame } from './components/games/CrashGame';
import { CoinFlipGame } from './components/games/CoinFlipGame';
import { DiceGame } from './components/games/DiceGame';
import { PlinkoGame } from './components/games/PlinkoGame';
import { MinesGame } from './components/games/MinesGame';
import { HiLoGame } from './components/games/HiLoGame';

type ActiveTab = 'CRICKET' | 'GAMES' | 'TOURNAMENTS' | 'LEADERBOARDS' | 'MULTIPLAYER' | 'ACTIVITY';
type ActiveGameId =
  | 'slots'
  | 'blackjack'
  | 'poker'
  | 'roulette'
  | 'crash'
  | 'coinflip'
  | 'dice'
  | 'plinko'
  | 'mines'
  | 'hilo';

export default function App() {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('CRICKET');
  const [selectedGame, setSelectedGame] = useState<ActiveGameId>('coinflip');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'admin'>('signup');
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isApkGuideOpen, setIsApkGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserState(user);
    }
  }, []);

  const handleUserLogin = (user: UserProfile) => {
    setCurrentUserState(user);
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserState(null);
    setIsAuthOpen(true);
    setAuthMode('login');
  };

  const handleBalanceUpdated = (newBalance: number) => {
    if (currentUser) {
      setCurrentUserState({ ...currentUser, balance: newBalance });
    }
  };

  const handleOpenWallet = (tab: 'deposit' | 'withdraw' | 'history' = 'deposit') => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setWalletInitialTab(tab);
    setIsWalletOpen(true);
  };

  // If user is not logged in: first interface is Sign Up and Login as requested
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
        <Navbar
          user={null}
          onOpenWallet={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsAuthOpen(true)}
          onOpenAdmin={() => {
            setAuthMode('admin');
            setIsAuthOpen(true);
          }}
          onOpenAuth={() => {
            setAuthMode('signup');
            setIsAuthOpen(true);
          }}
        />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-3xl w-full text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
              <Gift className="w-4 h-4 text-yellow-400" />
              <span>Instant $0.10 USD (₹{(WELCOME_BONUS_USD * 86.5).toFixed(0)} INR) Welcome Bonus on Sign Up!</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Small Casino
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Premier online gaming & live Indian cricket sports betting. Instant UPI deposits to <strong>amankumarsah@fam</strong>, fast 3-5 hours withdrawals, and provably fair certified games.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-blue-500/30">
                <span className="text-2xl">🏏</span>
                <div className="text-xs font-bold text-white mt-1">Live Cricket (India)</div>
                <div className="text-[10px] text-blue-400">ODI Series & IPL Live</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-2xl">₹</span>
                <div className="text-xs font-bold text-white mt-1">Instant UPI & INR</div>
                <div className="text-[10px] text-amber-400">amankumarsah@fam</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-2xl">⏱️</span>
                <div className="text-xs font-bold text-white mt-1">3 to 5 Hours Payouts</div>
                <div className="text-[10px] text-emerald-400">Rapid Admin Approval</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                <span className="text-2xl">🛡️</span>
                <div className="text-xs font-bold text-white mt-1">Provably Fair</div>
                <div className="text-[10px] text-emerald-400">Licensed in UK & Malta</div>
              </div>
            </div>

            {/* Primary Action Buttons including Admin 2FA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-xl shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Sign Up & Claim Bonus</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl font-black text-sm bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 transition-all cursor-pointer"
              >
                Player Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('admin');
                  setIsAuthOpen(true);
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-sm bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Admin Login (2FA)</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setIsApkGuideOpen(true)}
                className="hover:text-emerald-400 flex items-center gap-1.5 underline cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>How to Convert & Install as Android APK</span>
              </button>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Licensed in UK & Malta</span>
              </div>
            </div>
          </div>
        </main>

        <AuthModal
          initialMode={authMode}
          onSuccess={handleUserLogin}
          onClose={() => setIsAuthOpen(false)}
        />

        <ApkGuideModal
          isOpen={isApkGuideOpen}
          onClose={() => setIsApkGuideOpen(false)}
        />
      </div>
    );
  }

  // Authenticated Player Dashboard
  const gameCards: Array<{
    id: ActiveGameId;
    name: string;
    category: string;
    icon: string;
    badge: string;
  }> = [
    {
      id: 'coinflip',
      name: 'Dual Coin Flip',
      category: 'Fast Action',
      icon: '🪙',
      badge: '5.0X JACKPOT',
    },
    {
      id: 'dice',
      name: 'Lucky Dice',
      category: 'Fast Action',
      icon: '🎲',
      badge: 'OVER/UNDER',
    },
    {
      id: 'plinko',
      name: 'Plinko Pyramid',
      category: 'Pegboard Game',
      icon: '🎯',
      badge: '15X BUCKET',
    },
    {
      id: 'mines',
      name: 'Mines Grid',
      category: 'Treasure Strategy',
      icon: '💎',
      badge: '28X GEMS',
    },
    {
      id: 'hilo',
      name: 'Hi-Lo Duel',
      category: 'Card Prediction',
      icon: '🎴',
      badge: '5X PAYOUT',
    },
    {
      id: 'slots',
      name: 'Royal Slots 777',
      category: '5-Reel Deluxe',
      icon: '🎰',
      badge: 'BONUS SPINS',
    },
    {
      id: 'blackjack',
      name: 'Blackjack VIP 21',
      category: 'Table Cards',
      icon: '♠️',
      badge: 'PAYS 3:2',
    },
    {
      id: 'poker',
      name: 'Caribbean Poker',
      category: '5-Card Poker',
      icon: '🃏',
      badge: '250X ROYAL',
    },
    {
      id: 'roulette',
      name: 'European Roulette',
      category: 'Classic Wheel',
      icon: '🎡',
      badge: '5.0X OUTSIDE',
    },
    {
      id: 'crash',
      name: 'Rocket Crash',
      category: 'Multiplier Curve',
      icon: '🚀',
      badge: 'HIGH MULTIPLIER',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        user={currentUser}
        onOpenWallet={handleOpenWallet}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleLogout}
        onOpenApkGuide={() => setIsApkGuideOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Cricket Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('CRICKET')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'CRICKET'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                  : 'text-blue-300 hover:text-white bg-blue-950/40 border border-blue-500/30'
              }`}
            >
              <span className="text-base">🏏</span>
              <span>Live Cricket (India)</span>
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('GAMES')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'GAMES'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Casino Games ({gameCards.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TOURNAMENTS')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'TOURNAMENTS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Tournaments</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LEADERBOARDS')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'LEADERBOARDS'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Leaderboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MULTIPLAYER')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'MULTIPLAYER'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Multiplayer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ACTIVITY')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ACTIVITY'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <History className="w-4 h-4 text-cyan-400" />
              <span>History</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsApkGuideOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>APK Guide</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenWallet('deposit')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Cashier</span>
            </button>
          </div>
        </div>

        {/* TAB 0: LIVE CRICKET SPORTS BETTING */}
        {activeTab === 'CRICKET' && (
          <CricketBetting
            user={currentUser}
            onBalanceUpdated={handleBalanceUpdated}
            onUserUpdated={setCurrentUserState}
          />
        )}

        {/* TAB 1: CASINO GAMES */}
        {activeTab === 'GAMES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {gameCards.map((g) => {
                const isSelected = selectedGame === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGame(g.id)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10 scale-102'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xl">{g.icon}</span>
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        {g.badge}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white truncate">{g.name}</div>
                      <div className="text-[9px] text-slate-400 truncate">{g.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              {selectedGame === 'coinflip' && (
                <CoinFlipGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'dice' && (
                <DiceGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'plinko' && (
                <PlinkoGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'mines' && (
                <MinesGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'hilo' && (
                <HiLoGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'slots' && (
                <SlotsGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'blackjack' && (
                <BlackjackGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'poker' && (
                <PokerGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'roulette' && (
                <RouletteGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
              {selectedGame === 'crash' && (
                <CrashGame
                  user={currentUser}
                  onBalanceUpdated={handleBalanceUpdated}
                  onUserUpdated={setCurrentUserState}
                />
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TOURNAMENTS */}
        {activeTab === 'TOURNAMENTS' && (
          <TournamentsView
            currentUser={currentUser}
            onSelectGame={(gId) => {
              setSelectedGame(gId as ActiveGameId);
              setActiveTab('GAMES');
            }}
          />
        )}

        {/* TAB 3: LEADERBOARDS */}
        {activeTab === 'LEADERBOARDS' && <LeaderboardView currentUser={currentUser} />}

        {/* TAB 4: MULTIPLAYER DASHBOARD */}
        {activeTab === 'MULTIPLAYER' && (
          <MultiplayerDashboard
            currentUser={currentUser}
            onSelectGame={(gId) => {
              setSelectedGame(gId as ActiveGameId);
              setActiveTab('GAMES');
            }}
            onOpenTournaments={() => setActiveTab('TOURNAMENTS')}
            onOpenLeaderboards={() => setActiveTab('LEADERBOARDS')}
          />
        )}

        {/* TAB 5: ACTIVITY HISTORY */}
        {activeTab === 'ACTIVITY' && (
          <ActivityHistory
            currentUser={currentUser}
            onSelectGame={(gId) => {
              setSelectedGame(gId as ActiveGameId);
              setActiveTab('GAMES');
            }}
          />
        )}
      </main>

      {/* Footer with Licensing Notice & UPI */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Small Casino</span>
            <span>•</span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Provably Fair • Licensed in UK & Malta
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <span className="text-emerald-400 font-bold">UPI: amankumarsah@fam</span>
            <span>•</span>
            <span>TRON (TRC20): TKufhg...GX68</span>
            <span>•</span>
            <span>Withdrawals: 3-5 Hours</span>
            <span>•</span>
            <button
              onClick={() => setIsApkGuideOpen(true)}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              APK Guide
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isAuthOpen && (
        <AuthModal
          initialMode={authMode}
          onSuccess={handleUserLogin}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {isWalletOpen && currentUser && (
        <WalletModal
          user={currentUser}
          isOpen={isWalletOpen}
          initialTab={walletInitialTab}
          onClose={() => setIsWalletOpen(false)}
          onBalanceUpdated={handleBalanceUpdated}
        />
      )}

      {isProfileOpen && currentUser && (
        <ProfileModal
          user={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onUserUpdated={setCurrentUserState}
          onLogout={handleLogout}
        />
      )}

      {isAdminOpen && currentUser && (
        <AdminPanel
          currentUser={currentUser}
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onSignOut={handleLogout}
          onRefreshData={() => {
            const updated = getCurrentUser();
            if (updated) setCurrentUserState(updated);
          }}
        />
      )}

      <ApkGuideModal
        isOpen={isApkGuideOpen}
        onClose={() => setIsApkGuideOpen(false)}
      />
    </div>
  );
}
