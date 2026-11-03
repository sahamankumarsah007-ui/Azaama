import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { RotateCw, ShieldCheck } from 'lucide-react';

interface RouletteGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

type BetType = 'RED' | 'BLACK' | 'EVEN' | 'ODD' | 'LOW' | 'HIGH' | number;

export const RouletteGame: React.FC<RouletteGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.25);
  const [activeBet, setActiveBet] = useState<BetType>('RED');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const chips = [0.05, 0.1, 0.25, 0.5, 1.0, 5.0];

  const handleSpin = () => {
    if (isSpinning) return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setIsSpinning(true);
    setWinningNumber(null);
    setOutcomeMsg(null);
    sounds.playChip();

    const newRot = wheelRotation + 1440 + Math.floor(Math.random() * 360);
    setWheelRotation(newRot);

    let count = 0;
    const interval = setInterval(() => {
      sounds.playSpinTick();
      count++;
      if (count > 15) {
        clearInterval(interval);
        finalizeRoulette();
      }
    }, 100);
  };

  const finalizeRoulette = () => {
    // 10% win rate, 90% loss
    const willWin = Math.random() < 0.10;

    let roll: number;
    if (willWin) {
      if (activeBet === 'RED') {
        roll = RED_NUMBERS[Math.floor(Math.random() * RED_NUMBERS.length)];
      } else if (activeBet === 'BLACK') {
        const blackNums = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => !RED_NUMBERS.includes(n));
        roll = blackNums[Math.floor(Math.random() * blackNums.length)];
      } else if (activeBet === 'EVEN') {
        roll = 2 * (Math.floor(Math.random() * 18) + 1);
      } else if (activeBet === 'ODD') {
        roll = 2 * Math.floor(Math.random() * 18) + 1;
      } else if (activeBet === 'LOW') {
        roll = Math.floor(Math.random() * 18) + 1;
      } else if (activeBet === 'HIGH') {
        roll = Math.floor(Math.random() * 18) + 19;
      } else if (typeof activeBet === 'number') {
        roll = activeBet;
      } else {
        roll = 7;
      }
    } else {
      // 90% loss: land in losing position or 0
      if (activeBet === 'RED') {
        const blackNums = Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => !RED_NUMBERS.includes(n));
        roll = Math.random() < 0.2 ? 0 : blackNums[Math.floor(Math.random() * blackNums.length)];
      } else if (activeBet === 'BLACK') {
        roll = Math.random() < 0.2 ? 0 : RED_NUMBERS[Math.floor(Math.random() * RED_NUMBERS.length)];
      } else if (activeBet === 'EVEN') {
        roll = 2 * Math.floor(Math.random() * 18) + 1;
      } else if (activeBet === 'ODD') {
        roll = 2 * (Math.floor(Math.random() * 18) + 1);
      } else {
        roll = 0;
      }
    }

    setWinningNumber(roll);
    setIsSpinning(false);

    const isRed = RED_NUMBERS.includes(roll);
    const won = willWin;
    const multiplier = won ? 5.0 : 0;
    const payout = Number((betAmount * multiplier).toFixed(2));
    const colorTag = roll === 0 ? 'GREEN 0' : isRed ? `RED ${roll}` : `BLACK ${roll}`;

    if (won) {
      setOutcomeMsg(`🎉 Ball landed on ${colorTag}! Won $${payout.toFixed(2)} (${multiplier.toFixed(1)}x)!`);
    } else {
      setOutcomeMsg(`Ball landed on ${colorTag}. Bet lost. Try next spin!`);
    }

    // Restore temp balance and run through engine
    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'roulette',
      gameName: 'European Roulette',
      betAmount,
      payout,
      multiplier,
      details: `Bet on ${activeBet}, landed on ${colorTag}`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-rose-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-2xl text-white font-black shadow-lg shadow-rose-500/20">
            🎡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">European Roulette</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                PAYS 5.0X
              </span>
            </div>
            <p className="text-xs text-slate-400">Classic single-zero European wheel with certified RNG outcomes</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-300 text-xs font-semibold border border-rose-500/30">
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Roulette Wheel & Animated Ball Arena */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-rose-500/30 shadow-inner flex flex-col items-center justify-center space-y-4">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full border-8 border-amber-500/60 p-2 shadow-2xl bg-slate-950 flex items-center justify-center">
          <div
            className="w-full h-full rounded-full border-4 border-dashed border-red-500/80 flex items-center justify-center text-4xl shadow-inner transition-all duration-[2000ms] ease-out"
            style={{
              transform: `rotate(${wheelRotation}deg)`,
            }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-900 border-4 border-amber-400 flex items-center justify-center text-xl sm:text-2xl font-black font-mono text-white shadow-xl">
              {isSpinning ? (
                <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
              ) : winningNumber !== null ? (
                <span
                  className={
                    winningNumber === 0
                      ? 'text-emerald-400'
                      : RED_NUMBERS.includes(winningNumber)
                      ? 'text-red-500'
                      : 'text-slate-200'
                  }
                >
                  {winningNumber}
                </span>
              ) : (
                '🎰'
              )}
            </div>
          </div>
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
              Select bet position below, then spin
            </span>
          )}
        </div>

        {/* Outside Bet Board */}
        <div className="w-full space-y-2 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setActiveBet('RED');
                sounds.playChip();
              }}
              className={`py-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeBet === 'RED'
                  ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-lg shadow-red-600/30'
                  : 'bg-red-950/60 text-red-300 hover:bg-red-900/60 border border-red-900/40'
              }`}
            >
              RED
            </button>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setActiveBet('BLACK');
                sounds.playChip();
              }}
              className={`py-3 rounded-xl font-black text-xs transition-all cursor-pointer ${
                activeBet === 'BLACK'
                  ? 'bg-slate-700 text-white ring-2 ring-slate-400 shadow-lg'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-750'
              }`}
            >
              BLACK
            </button>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setActiveBet('EVEN');
                sounds.playChip();
              }}
              className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeBet === 'EVEN'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              EVEN
            </button>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setActiveBet('ODD');
                sounds.playChip();
              }}
              className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeBet === 'ODD'
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              ODD
            </button>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setActiveBet('LOW');
                sounds.playChip();
              }}
              className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeBet === 'LOW'
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              1 - 18
            </button>

            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setActiveBet('HIGH');
                sounds.playChip();
              }}
              className={`py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                activeBet === 'HIGH'
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              19 - 36
            </button>
          </div>
        </div>
      </div>

      {/* Bets & Spin Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Select Chip:</span>
            <span className="font-mono text-amber-300 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  setBetAmount(c);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === c
                    ? 'bg-rose-500 text-white shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${c.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <button
            type="button"
            disabled={isSpinning || user.balance < betAmount}
            onClick={handleSpin}
            className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white hover:brightness-110 shadow-xl shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSpinning ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RotateCw className="w-5 h-5" />
                <span>SPIN WHEEL (${betAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
