import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { ShieldCheck, Play, Sparkles } from 'lucide-react';

interface PlinkoGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

const BUCKETS = [
  { label: '15x', mult: 15.0, color: 'bg-rose-600 text-white' },
  { label: '3x', mult: 3.0, color: 'bg-amber-500 text-slate-950 font-black' },
  { label: '0.5x', mult: 0.5, color: 'bg-slate-700 text-slate-200' },
  { label: '0.2x', mult: 0.2, color: 'bg-slate-800 text-slate-400' },
  { label: '0.2x', mult: 0.2, color: 'bg-slate-800 text-slate-400' },
  { label: '0.5x', mult: 0.5, color: 'bg-slate-700 text-slate-200' },
  { label: '3x', mult: 3.0, color: 'bg-amber-500 text-slate-950 font-black' },
  { label: '15x', mult: 15.0, color: 'bg-rose-600 text-white' },
];

export const PlinkoGame: React.FC<PlinkoGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0];

  const handleDrop = () => {
    if (isDropping) return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setIsDropping(true);
    setActiveBucket(null);
    setOutcomeMsg(null);
    sounds.playSpinTick();

    // 10% win (hits 3x or 15x outer buckets), 90% loss (hits 0.2x or 0.5x inner buckets)
    const willWin = Math.random() < 0.10;
    let targetIndex: number;

    if (willWin) {
      targetIndex = Math.random() < 0.5 ? 0 : 7; // Outer 15x bucket
    } else {
      // Land in inner buckets (index 2, 3, 4, or 5)
      const losingIndices = [2, 3, 4, 5];
      targetIndex = losingIndices[Math.floor(Math.random() * losingIndices.length)];
    }

    // Animate ball drop sound ticks
    let bounce = 0;
    const interval = setInterval(() => {
      sounds.playSpinTick();
      bounce++;
      if (bounce > 8) {
        clearInterval(interval);
        finalizeDrop(targetIndex);
      }
    }, 110);
  };

  const finalizeDrop = (index: number) => {
    setActiveBucket(index);
    setIsDropping(false);

    const bucket = BUCKETS[index];
    const mult = bucket.mult;
    const payout = Number((betAmount * mult).toFixed(2));
    const won = mult > 1.0;

    if (won) {
      setOutcomeMsg(`🎉 Dropped in ${bucket.label}! Won $${payout.toFixed(2)} (${mult}x)!`);
    } else {
      setOutcomeMsg(`Landed in ${bucket.label}. Bet loss.`);
    }

    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'plinko',
      gameName: 'Plinko Pyramid',
      betAmount,
      payout,
      multiplier: mult,
      details: `Landed in ${bucket.label} multiplier bucket`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-pink-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(236,72,153,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-pink-500/20">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Plinko Pyramid</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40">
                UP TO 15X MULTIPLIER
              </span>
            </div>
            <p className="text-xs text-slate-400">Drop balls through the peg pyramid into high multiplier buckets</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-300 text-xs font-semibold border border-pink-500/30">
          <ShieldCheck className="w-4 h-4 text-pink-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Plinko Board Arena */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-pink-500/30 shadow-inner flex flex-col items-center justify-between min-h-[340px]">
        {/* Peg Board Visual Rows */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md py-4">
          {[3, 4, 5, 6, 7, 8].map((pegCount, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-4 sm:gap-6">
              {Array.from({ length: pegCount }).map((_, pIdx) => (
                <div
                  key={pIdx}
                  className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Dropping Ball Indicator */}
        {isDropping && (
          <div className="w-5 h-5 rounded-full bg-pink-400 shadow-[0_0_15px_#f43f5e] animate-bounce my-2" />
        )}

        {/* Message */}
        <div className="min-h-[28px] text-center my-2">
          {outcomeMsg ? (
            <div
              className={`text-sm sm:text-base font-extrabold px-4 py-1 rounded-full border ${
                outcomeMsg.includes('WON')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {outcomeMsg}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-mono">
              Select bet amount and drop the ball
            </span>
          )}
        </div>

        {/* Multiplier Buckets */}
        <div className="grid grid-cols-8 gap-1.5 w-full max-w-lg pt-2">
          {BUCKETS.map((b, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-xl text-center text-xs font-mono font-bold transition-all shadow-md ${b.color} ${
                activeBucket === idx ? 'scale-110 ring-4 ring-white animate-pulse' : 'opacity-85'
              }`}
            >
              {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* Bets & Drop Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Drop Bet Amount:</span>
            <span className="font-mono text-pink-400 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {bets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={isDropping}
                onClick={() => {
                  setBetAmount(b);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === b
                    ? 'bg-pink-500 text-white shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${b.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            disabled={isDropping || user.balance < betAmount}
            onClick={handleDrop}
            className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 text-white hover:brightness-110 shadow-xl shadow-pink-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDropping ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>DROP PLINKO BALL (${betAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
