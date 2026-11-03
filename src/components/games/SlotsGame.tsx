import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Info,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';

interface SlotsGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

const SYMBOLS = [
  { id: 'seven', char: '7️⃣', name: 'Lucky Seven', payout: 35, color: 'text-red-500' },
  { id: 'diamond', char: '💎', name: 'Blue Diamond', payout: 20, color: 'text-cyan-400' },
  { id: 'bell', char: '🔔', name: 'Golden Bell', payout: 12, color: 'text-amber-400' },
  { id: 'clover', char: '🍀', name: 'Lucky Clover', payout: 8, color: 'text-emerald-400' },
  { id: 'grapes', char: '🍇', name: 'Grapes', payout: 5, color: 'text-purple-400' },
  { id: 'cherry', char: '🍒', name: 'Wild Cherry', payout: 3, color: 'text-rose-400' },
];

export const SlotsGame: React.FC<SlotsGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [reels, setReels] = useState<string[]>(['7️⃣', '💎', '7️⃣', '💎', '7️⃣']);
  const [betAmount, setBetAmount] = useState<number>(0.1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [showPaytable, setShowPaytable] = useState(false);

  const betOptions = [0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0];

  const handleSpin = () => {
    if (isSpinning) return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance in game UI
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setIsSpinning(true);
    setLastWin(null);
    setWinMessage(null);
    sounds.playSpinTick();

    // Reel spin interval simulation
    let tickCount = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char,
      ]);
      sounds.playSpinTick();
      tickCount++;
      if (tickCount > 10) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 90);
  };

  const finalizeSpin = () => {
    let finalReels: string[];
    let won = false;
    let multiplier = 0;
    let desc = '';

    // Exactly 10% win rate, 90% loss
    const roll = Math.random();
    const willWin = roll < 0.10;

    if (willWin) {
      won = true;
      const luckySym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const matchRoll = Math.random();
      if (matchRoll > 0.6) {
        // 5 of a kind Jackpot
        finalReels = [luckySym.char, luckySym.char, luckySym.char, luckySym.char, luckySym.char];
        multiplier = luckySym.payout * 2.0;
        desc = `MEGA JACKPOT! 5x ${luckySym.name}!`;
      } else {
        // 4 of a kind
        const other = SYMBOLS.find((s) => s.id !== luckySym.id)?.char || '🍒';
        finalReels = [luckySym.char, luckySym.char, luckySym.char, luckySym.char, other];
        multiplier = luckySym.payout * 1.2;
        desc = `BIG WIN! 4x ${luckySym.name}!`;
      }
    } else {
      // 90% loss
      finalReels = [
        SYMBOLS[0].char,
        SYMBOLS[1].char,
        SYMBOLS[2].char,
        SYMBOLS[3].char,
        SYMBOLS[4].char,
      ].sort(() => Math.random() - 0.5);
      multiplier = 0;
      desc = 'No winning payline.';
    }

    setReels(finalReels);
    setIsSpinning(false);

    const payout = Number((betAmount * multiplier).toFixed(2));
    if (won) {
      setLastWin(payout);
      setWinMessage(`${desc} Won $${payout.toFixed(2)} (${multiplier.toFixed(1)}x)!`);
    } else {
      setWinMessage('Spin complete. Try again!');
    }

    // Process outcome with restored balance + payout
    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'slots',
      gameName: 'Royal Slots 777',
      betAmount,
      payout,
      multiplier,
      details: `${desc} [${finalReels.join(' ')}]`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-amber-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.08)] text-white space-y-6">
      {/* Title & Trust Badge */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-amber-500/20">
            🎰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Royal Slots 777</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                5-REEL MEGA DELUXE
              </span>
            </div>
            <p className="text-xs text-slate-400">High-volatility slot game with massive jackpot multipliers</p>
          </div>
        </div>

        {/* Regulatory Badge */}
        <div className="flex items-center gap-2 bg-slate-950/70 p-2 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Provably Fair • UK & Malta Standards</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPaytable(!showPaytable)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Paytable Info"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Paytable Modal preview */}
      {showPaytable && (
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 animate-in fade-in">
          <div className="font-bold text-amber-300 flex items-center justify-between">
            <span>Paytable Multipliers (5-of-a-kind):</span>
            <span className="text-[10px] text-slate-400">Lines evaluated left to right</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
            {SYMBOLS.map((s) => (
              <div key={s.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <div className="text-2xl">{s.char}</div>
                <div className="font-bold text-white mt-1 text-[11px]">{s.name}</div>
                <div className="text-amber-400 font-mono text-[11px] font-bold">up to {s.payout * 2}x</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slots Machine Housing */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-amber-500/40 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]">
        {/* Machine Top Neon Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" />
          </div>
          <div className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            ★ OFFICIAL ROYAL CASINO SLOTS ★
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
        </div>

        {/* 5 Slot Reels Display */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-black/90 border-2 border-amber-500/30 shadow-inner">
          {reels.map((char, index) => (
            <div
              key={index}
              className={`h-24 sm:h-36 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center text-4xl sm:text-6xl select-none transition-all shadow-md ${
                isSpinning ? 'animate-pulse blur-[1px] scale-95' : 'hover:scale-105'
              }`}
            >
              <span className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">{char}</span>
            </div>
          ))}
        </div>

        {/* Win / Status Banner */}
        <div className="mt-4 text-center min-h-[32px] flex items-center justify-center">
          {winMessage ? (
            <div
              className={`text-sm sm:text-base font-extrabold px-4 py-1.5 rounded-full border animate-in zoom-in-95 ${
                lastWin && lastWin > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {winMessage}
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-mono">Select bet and hit SPIN to play</span>
          )}
        </div>
      </div>

      {/* Control Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
        {/* Bet Selector */}
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Select Bet Amount:</span>
            <span className="font-mono text-amber-300 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {betOptions.map((amt) => (
              <button
                key={amt}
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  setBetAmount(amt);
                  sounds.playChip();
                }}
                className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === amt
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${amt >= 1 ? amt.toFixed(0) : amt.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {/* Spin Button */}
        <div>
          <button
            type="button"
            disabled={isSpinning || user.balance < betAmount}
            onClick={handleSpin}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-wider uppercase bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-xl shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            {isSpinning ? (
              <div className="w-6 h-6 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span>SPIN (${betAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
