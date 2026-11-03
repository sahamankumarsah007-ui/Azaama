import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import { UserProfile, BetActivity } from '../types';
import { getActivities } from '../utils/storage';

interface MultiplayerDashboardProps {
  currentUser: UserProfile;
  onSelectGame: (gameId: string) => void;
  onOpenTournaments: () => void;
  onOpenLeaderboards: () => void;
}

const SIMULATED_PLAYERS = [
  'CryptoKing_99',
  'SatoshiStriker',
  'LuckyVegas',
  'DiamondAce',
  'NeonSpinner',
  'TokyoRoller',
  'DubaiWhale',
  'BullishBettor',
  'CyberQueen',
];

const GAMES_LIST = [
  { id: 'slots', name: 'Royal Slots 777' },
  { id: 'blackjack', name: 'Blackjack VIP' },
  { id: 'poker', name: 'Caribbean Poker' },
  { id: 'roulette', name: 'European Roulette' },
  { id: 'coinflip', name: '50:50 Coin Flip' },
  { id: 'dice', name: '50:50 Dice' },
  { id: 'crash', name: 'Rocket Crash' },
];

export const MultiplayerDashboard: React.FC<MultiplayerDashboardProps> = ({
  currentUser,
  onSelectGame,
  onOpenTournaments,
  onOpenLeaderboards,
}) => {
  const [liveFeed, setLiveFeed] = useState<Array<{
    id: string;
    player: string;
    game: string;
    bet: number;
    payout: number;
    multiplier: number;
    won: boolean;
    time: string;
  }>>([
    {
      id: 'lf_1',
      player: 'SatoshiStriker',
      game: '50:50 Coin Flip',
      bet: 5.0,
      payout: 9.9,
      multiplier: 1.98,
      won: true,
      time: 'Just now',
    },
    {
      id: 'lf_2',
      player: 'TokyoRoller',
      game: 'Royal Slots 777',
      bet: 2.0,
      payout: 30.0,
      multiplier: 15.0,
      won: true,
      time: '12s ago',
    },
    {
      id: 'lf_3',
      player: 'CryptoKing_99',
      game: 'Rocket Crash',
      bet: 1.5,
      payout: 6.3,
      multiplier: 4.2,
      won: true,
      time: '24s ago',
    },
    {
      id: 'lf_4',
      player: 'CyberQueen',
      game: 'Blackjack VIP',
      bet: 10.0,
      payout: 25.0,
      multiplier: 2.5,
      won: true,
      time: '45s ago',
    },
  ]);

  // Periodic random live bet generation
  useEffect(() => {
    const interval = setInterval(() => {
      const p = SIMULATED_PLAYERS[Math.floor(Math.random() * SIMULATED_PLAYERS.length)];
      const g = GAMES_LIST[Math.floor(Math.random() * GAMES_LIST.length)];
      const bet = Number((0.2 + Math.random() * 4.8).toFixed(2));
      const won = Math.random() < 0.52; // 50:50 thrill
      const mult = won ? Number((1.5 + Math.random() * 6).toFixed(2)) : 0;
      const payout = won ? Number((bet * mult).toFixed(2)) : 0;

      const newEntry = {
        id: 'lf_' + Date.now(),
        player: p,
        game: g.name,
        bet,
        payout,
        multiplier: mult,
        won,
        time: 'Just now',
      };

      setLiveFeed((prev) => [newEntry, ...prev.slice(0, 14)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Live Stream Ticker */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-800 p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>LIVE BETS</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-xs">
            {liveFeed.slice(0, 5).map((item) => (
              <div key={item.id} className="inline-flex items-center gap-2">
                <span className="font-semibold text-slate-300">@{item.player}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{item.game}</span>
                {item.won ? (
                  <span className="font-bold text-emerald-400 font-mono">
                    +${item.payout.toFixed(2)} ({item.multiplier}x)
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono">-${item.bet.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tournaments Spotlight Banner & Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tournament Spotlight */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/30 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Featured Live Tournament
                </span>
                <h3 className="text-xl font-black text-white">Daily 50:50 Showdown ($500 USDT)</h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold animate-pulse">
              Ends in 6h 42m
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-4 max-w-xl">
            Compete against players worldwide in fast 50:50 coin flips, dice, and slots. Top 10 leaders take a share of the $500 USDT prize pool directly credited to wallet balance.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Your Current Rank</span>
                <strong className="text-amber-300 font-mono text-sm">#12 (840 pts)</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Leader</span>
                <strong className="text-white">@SatoshiStriker</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Active Entrants</span>
                <strong className="text-emerald-400 font-mono">184 Players</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenTournaments}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>View All Tournaments</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Global Leaderboards Quick Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>Today's Top High Rollers</span>
              </h3>
              <span className="text-[10px] text-slate-500">Global</span>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'SatoshiStriker', profit: '+$8,420', emoji: '👑' },
                { name: 'NeonViper', profit: '+$5,120', emoji: '⚡' },
                { name: 'DiamondHands', profit: '+$4,690', emoji: '💎' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-bold">#{i + 1}</span>
                    <span>{item.emoji}</span>
                    <span className="font-semibold text-slate-200">@{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{item.profit}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLeaderboards}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer text-center"
          >
            View Full Leaderboard →
          </button>
        </div>
      </div>

      {/* Live Multiplayer Feed Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-black text-base text-white">Live Multiplayer Bets Feed</h3>
          </div>
          <span className="text-xs text-slate-400">Streamed from blockchain lobby</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Player</th>
                <th className="pb-3">Game</th>
                <th className="pb-3">Bet Amount</th>
                <th className="pb-3">Multiplier</th>
                <th className="pb-3 text-right">Payout ($ USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liveFeed.map((b) => (
                <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    <span className="text-amber-400">@</span>
                    {b.player}
                  </td>
                  <td className="py-3 text-slate-300">{b.game}</td>
                  <td className="py-3 font-mono text-slate-400">${b.bet.toFixed(2)}</td>
                  <td className="py-3 font-mono">
                    {b.won ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                        {b.multiplier.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-slate-500">0.00x</span>
                    )}
                  </td>
                  <td className="py-3 font-mono font-bold text-right">
                    {b.won ? (
                      <span className="text-emerald-400">+${b.payout.toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-500">-$0.00</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
