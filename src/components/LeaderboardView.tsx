import React, { useState } from 'react';
import { Trophy, Medal, Flame, TrendingUp, Search, User } from 'lucide-react';
import { LeaderboardPlayer, UserProfile, PREDEFINED_AVATARS } from '../types';
import { SEED_LEADERBOARDS } from '../utils/storage';

interface LeaderboardViewProps {
  currentUser: UserProfile;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser }) => {
  const [period, setPeriod] = useState<'TODAY' | 'WEEK' | 'ALL_TIME'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');

  const currentAvatar =
    PREDEFINED_AVATARS.find((a) => a.id === currentUser.avatarId) || PREDEFINED_AVATARS[0];

  const userWinRate =
    currentUser.stats.totalBets > 0
      ? Number(((currentUser.stats.wins / currentUser.stats.totalBets) * 100).toFixed(1))
      : 50.0;

  // Build full list including current player
  const players: LeaderboardPlayer[] = [
    ...SEED_LEADERBOARDS,
    {
      rank: 7,
      username: currentUser.username,
      avatarEmoji: currentAvatar.emoji,
      avatarGradient: currentAvatar.bgGradient,
      totalWagered: currentUser.stats.totalWagered,
      netProfit: currentUser.stats.netProfit,
      winRate: userWinRate,
      biggestWin: currentUser.stats.biggestWin,
      isCurrentUser: true,
    },
  ];

  const filtered = players.filter((p) =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white">Global High Rollers Leaderboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Top winners and most active players across all Small Casino games
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(['TODAY', 'WEEK', 'ALL_TIME'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === p
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {players.slice(0, 3).map((p, idx) => {
          const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
          const borders = ['border-amber-400/60', 'border-slate-400/40', 'border-amber-700/40'];
          const glows = [
            'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
            'shadow-[0_0_20px_rgba(148,163,184,0.1)]',
            'shadow-[0_0_20px_rgba(180,83,9,0.1)]',
          ];

          return (
            <div
              key={p.rank}
              className={`rounded-3xl bg-slate-900 border ${borders[idx]} ${glows[idx]} p-5 flex flex-col items-center text-center relative overflow-hidden`}
            >
              <div className="text-xs font-bold text-amber-300 mb-3 uppercase tracking-wider">
                {medals[idx]}
              </div>

              <div
                className={`w-18 h-18 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-tr ${p.avatarGradient} border-2 border-white/20 shadow-xl mb-3`}
              >
                {p.avatarEmoji}
              </div>

              <h4 className="font-black text-base text-white">@{p.username}</h4>
              <div className="font-mono text-xl font-black text-emerald-400 mt-1">
                +${p.netProfit.toLocaleString()} USD
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 w-full grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>
                  <span>Wagered:</span>
                  <div className="font-mono font-bold text-slate-200">${p.totalWagered.toLocaleString()}</div>
                </div>
                <div>
                  <span>Win Rate:</span>
                  <div className="font-mono font-bold text-amber-400">{p.winRate}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-white">Rankings Table</h3>
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Player</th>
                <th className="pb-3">Total Wagered</th>
                <th className="pb-3">Win Rate</th>
                <th className="pb-3">Biggest Win</th>
                <th className="pb-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((player) => (
                <tr
                  key={player.rank}
                  className={`transition-colors ${
                    player.isCurrentUser
                      ? 'bg-amber-500/10 border-l-4 border-amber-400'
                      : 'hover:bg-slate-850/50'
                  }`}
                >
                  <td className="py-3.5 font-mono font-black text-amber-400">
                    #{player.rank}
                  </td>
                  <td className="py-3.5 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{player.avatarEmoji}</span>
                      <span>@{player.username}</span>
                      {player.isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-slate-300">
                    ${player.totalWagered.toLocaleString()}
                  </td>
                  <td className="py-3.5 font-mono text-amber-300">
                    {player.winRate}%
                  </td>
                  <td className="py-3.5 font-mono text-slate-300">
                    ${player.biggestWin.toLocaleString()}
                  </td>
                  <td className="py-3.5 font-mono font-bold text-right text-emerald-400">
                    +${player.netProfit.toLocaleString()} USD
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
