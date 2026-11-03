import React, { useState } from 'react';
import { History, Trophy, ArrowUpRight, ArrowDownLeft, Filter, Search, RotateCcw } from 'lucide-react';
import { BetActivity, UserProfile } from '../types';
import { getActivities } from '../utils/storage';

interface ActivityHistoryProps {
  currentUser: UserProfile;
  onSelectGame?: (gameId: string) => void;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  currentUser,
  onSelectGame,
}) => {
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [gameFilter, setGameFilter] = useState<string>('ALL');

  const activities = getActivities().filter(
    (a) => a.userId === currentUser.id || a.username === currentUser.username
  );

  const filtered = activities.filter((act) => {
    if (outcomeFilter !== 'ALL' && act.outcome !== outcomeFilter) return false;
    if (gameFilter !== 'ALL' && act.gameId !== gameFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white">Player Activity & Bet History Feed</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time auditable history of all games, wagers, multipliers, and payouts
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Outcome Filter */}
          <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800">
            {(['ALL', 'WIN', 'LOSS'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setOutcomeFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  outcomeFilter === filter
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter === 'ALL' ? 'All Wagers' : filter === 'WIN' ? 'Wins Only' : 'Losses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Activity Feed Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-300">
            Showing {filtered.length} total game bets
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Synced locally</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
            <History className="w-8 h-8 text-slate-600" />
            <span>No activity records logged yet. Play a game above to start your streak!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Game</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Bet ($)</th>
                  <th className="pb-3">Multiplier</th>
                  <th className="pb-3">Outcome Details</th>
                  <th className="pb-3 text-right">Profit / Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((act) => {
                  const isWin = act.outcome === 'WIN';
                  const isPush = act.outcome === 'PUSH';

                  return (
                    <tr key={act.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>{act.gameName}</span>
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-slate-400">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 font-mono text-slate-300 font-semibold">
                        ${act.betAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            isWin
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isPush
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {act.multiplier.toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                        {act.details || act.gameName}
                      </td>
                      <td className="py-3.5 font-mono font-bold text-right">
                        {isWin ? (
                          <span className="text-emerald-400">+${act.profit.toFixed(2)} USD</span>
                        ) : isPush ? (
                          <span className="text-amber-400">$0.00 (Push)</span>
                        ) : (
                          <span className="text-rose-400">-${act.betAmount.toFixed(2)} USD</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
