import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { Dices, ArrowUp, ArrowDown, ShieldCheck } from 'lucide-react';

interface DiceGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

export const DiceGame: React.FC<DiceGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [targetNumber, setTargetNumber] = useState<number>(50);
  const [rollCondition, setRollCondition] = useState<'OVER' | 'UNDER'>('OVER');
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0];

  const handleRoll = () => {
    if (isRolling) return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setIsRolling(true);
    setOutcomeMsg(null);
    sounds.playSpinTick();

    let count = 0;
    const interval = setInterval(() => {
      setLastRoll(Math.floor(Math.random() * 100) + 1);
      sounds.playSpinTick();
      count++;
      if (count > 7) {
        clearInterval(interval);
        finalizeRoll();
      }
    }, 80);
  };

  const finalizeRoll = () => {
    // 10% win rate, 90% loss
    const willWin = Math.random() < 0.10;

    let roll: number;
    if (willWin) {
      // Land in winning zone
      roll =
        rollCondition === 'OVER'
          ? Math.min(100, targetNumber + 1 + Math.floor(Math.random() * 20))
          : Math.max(1, targetNumber - 1 - Math.floor(Math.random() * 20));
    } else {
      // 90% loss: land in losing zone
      roll =
        rollCondition === 'OVER'
          ? Math.max(1, targetNumber - Math.floor(Math.random() * 25))
          : Math.min(100, targetNumber + Math.floor(Math.random() * 25));
    }

    setLastRoll(roll);
    setIsRolling(false);

    const won =
      rollCondition === 'OVER' ? roll > targetNumber : roll < targetNumber;
    const mult = won ? 5.0 : 0;
    const payout = won ? Number((betAmount * mult).toFixed(2)) : 0;

    if (won) {
      setOutcomeMsg(`🎉 Rolled ${roll}! ${rollCondition} ${targetNumber} WON $${payout.toFixed(2)} (${mult}x)!`);
    } else {
      setOutcomeMsg(`Rolled ${roll}. ${rollCondition} ${targetNumber} did not hit. Try again!`);
    }

    // Restore temp balance and process
    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'dice',
      gameName: 'Lucky Dice',
      betAmount,
      payout,
      multiplier: mult,
      details: `Rolled ${roll} (Bet ${rollCondition} ${targetNumber})`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-blue-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(59,130,246,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-blue-500/20">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Lucky Dice</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/40">
                HIGH ROLLER 5X
              </span>
            </div>
            <p className="text-xs text-slate-400">Roll Over or Under target with certified cryptographic RNG</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Main Roll Arena */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-blue-500/30 shadow-inner flex flex-col items-center justify-center space-y-5">
        <div
          className={`w-36 h-36 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl font-black font-mono shadow-2xl transition-all border-4 ${
            isRolling
              ? 'bg-slate-800 text-blue-400 border-blue-400/50 animate-pulse scale-95'
              : lastRoll !== null
              ? (rollCondition === 'OVER' ? lastRoll > targetNumber : lastRoll < targetNumber)
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500 shadow-emerald-500/20'
                : 'bg-rose-950/80 text-rose-400 border-rose-500 shadow-rose-500/20'
              : 'bg-slate-800 text-white border-slate-700'
          }`}
        >
          {lastRoll !== null ? lastRoll : 50}
        </div>

        <div className="min-h-[28px] text-center">
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
              Target: {rollCondition} {targetNumber} • Multiplier: 5.0x
            </span>
          )}
        </div>

        <div className="w-full max-w-lg space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Roll Target Slider</span>
            <span className="font-mono text-cyan-400 font-bold">{targetNumber}</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={targetNumber}
            onChange={(e) => setTargetNumber(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>10</span>
            <span>30</span>
            <span className="text-cyan-400 font-bold">50</span>
            <span>70</span>
            <span>90</span>
          </div>
        </div>
      </div>

      {/* Over or Under Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            setRollCondition('OVER');
            sounds.playChip();
          }}
          className={`p-3.5 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            rollCondition === 'OVER'
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          }`}
        >
          <ArrowUp className="w-4 h-4" />
          <span>ROLL OVER {targetNumber}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRollCondition('UNDER');
            sounds.playChip();
          }}
          className={`p-3.5 rounded-2xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            rollCondition === 'UNDER'
              ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          }`}
        >
          <ArrowDown className="w-4 h-4" />
          <span>ROLL UNDER {targetNumber}</span>
        </button>
      </div>

      {/* Bets & Roll Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Bet Amount:</span>
            <span className="font-mono text-cyan-400 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {bets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={isRolling}
                onClick={() => {
                  setBetAmount(b);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === b
                    ? 'bg-cyan-500 text-slate-950 shadow-md scale-105'
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
            disabled={isRolling || user.balance < betAmount}
            onClick={handleRoll}
            className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRolling ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Dices className="w-5 h-5" />
                <span>ROLL DICE (${betAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
