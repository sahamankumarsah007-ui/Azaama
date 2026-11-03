import React, { useState } from 'react';
import { Trophy, Clock, Users, ArrowRight, CheckCircle2, Flame, Award, Sparkles } from 'lucide-react';
import { Tournament, UserProfile } from '../types';
import { INITIAL_TOURNAMENTS } from '../utils/storage';
import { sounds } from '../utils/audio';

interface TournamentsViewProps {
  currentUser: UserProfile;
  onSelectGame: (gameId: string) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  currentUser,
  onSelectGame,
}) => {
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({
    tourn_5050_duel: true,
  });

  const handleJoin = (tournId: string) => {
    sounds.playWin();
    setJoinedMap((prev) => ({ ...prev, [tournId]: true }));
    setTournaments((prev) =>
      prev.map((t) => (t.id === tournId ? { ...t, participants: t.participants + 1 } : t))
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-black text-white">Live Multiplayer Tournaments</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compete on global leaderboards. Cash prizes are credited directly to your real wallet!
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>Total Prize Pool: $2,550 USDT</span>
        </div>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tournaments.map((t) => {
          const isJoined = joinedMap[t.id];
          return (
            <div
              key={t.id}
              className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-xl"
            >
              {/* Card Banner */}
              <div className={`p-5 bg-gradient-to-r ${t.bannerGradient} relative text-white`}>
                <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm">
                    {t.game}
                  </span>
                  <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <Clock className="w-3 h-3" />
                    <span>Live Now</span>
                  </span>
                </div>
                <h3 className="text-lg font-black">{t.title}</h3>
                <div className="mt-2 text-2xl font-black font-mono">
                  ${t.prizePoolUsd.toLocaleString()} USDT
                </div>
              </div>

              {/* Tournament Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Active Participants:</span>
                    <span className="text-white font-mono font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {t.participants} Players
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Minimum Bet:</span>
                    <span className="text-amber-300 font-mono font-bold">${t.minBet.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Your Current Position:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {isJoined ? `#${t.userRank} (${t.userScore} pts)` : 'Not joined yet'}
                    </span>
                  </div>
                </div>

                {/* Prize breakdown */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] space-y-1">
                  <span className="text-slate-400 font-bold block">Prize Distribution:</span>
                  <div className="flex justify-between text-slate-300 font-mono text-[10px]">
                    <span>1st: ${(t.prizePoolUsd * 0.5).toFixed(0)}</span>
                    <span>2nd: ${(t.prizePoolUsd * 0.25).toFixed(0)}</span>
                    <span>3rd: ${(t.prizePoolUsd * 0.15).toFixed(0)}</span>
                  </div>
                </div>

                {/* Join / Play CTA */}
                {isJoined ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (t.id === 'tourn_5050_duel') onSelectGame('coinflip');
                      else if (t.id === 'tourn_slots_championship') onSelectGame('slots');
                      else onSelectGame('blackjack');
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Joined! Play & Earn Points →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(t.id)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    <span>Join Free Tournament</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
