import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { Coins, ShieldCheck, Flame } from 'lucide-react';

interface CoinFlipGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

export const CoinFlipGame: React.FC<CoinFlipGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [selectedSide, setSelectedSide] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [coinResult, setCoinResult] = useState<'HEADS' | 'TAILS' | null>(null);
  const [outcomeMessage, setOutcomeMessage] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);

  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0];

  const handleFlip = () => {
    if (isFlipping) return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance with game
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setIsFlipping(true);
    setCoinResult(null);
    setOutcomeMessage(null);
    sounds.playChip();

    const tickInterval = setInterval(() => {
      sounds.playSpinTick();
    }, 120);

    setTimeout(() => {
      clearInterval(tickInterval);

      // Exactly 10% win rate, 90% loss
      const willWin = Math.random() < 0.10;
      const resultSide: 'HEADS' | 'TAILS' = willWin
        ? selectedSide
        : selectedSide === 'HEADS'
        ? 'TAILS'
        : 'HEADS';

      setCoinResult(resultSide);
      setIsFlipping(false);

      const won = resultSide === selectedSide;
      const multiplier = won ? 5.0 : 0; // high 5x reward on rare win
      const payout = won ? Number((betAmount * multiplier).toFixed(2)) : 0;

      if (won) {
        setStreak((prev) => prev + 1);
        setOutcomeMessage(`🎉 ${resultSide}! You WON $${payout.toFixed(2)} (${multiplier.toFixed(1)}x)!`);
      } else {
        setStreak(0);
        setOutcomeMessage(`Landed on ${resultSide}. Lost $${betAmount.toFixed(2)}.`);
      }

      // Restore temp balance and process through engine
      user.balance = Number((user.balance + betAmount).toFixed(2));
      processBetOutcome({
        user,
        gameId: 'coinflip',
        gameName: 'Dual Coin Flip',
        betAmount,
        payout,
        multiplier,
        details: `Bet on ${selectedSide}, flipped ${resultSide}`,
        onBalanceUpdated,
        onUserUpdated,
      });
    }, 1200);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-yellow-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(234,179,8,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-yellow-500/20">
            🪙
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Dual Coin Flip</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                HIGH VOLATILITY 5X
              </span>
            </div>
            <p className="text-xs text-slate-400">Heads or Tails. High multiplier jackpot payout on match.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* 3D Animated Coin Arena */}
      <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-yellow-500/30 shadow-inner flex flex-col items-center justify-center min-h-[280px]">
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center text-5xl font-black shadow-2xl transition-all duration-300 select-none ${
            isFlipping
              ? 'animate-spin scale-110 shadow-yellow-500/50'
              : coinResult === 'HEADS' || (!coinResult && selectedSide === 'HEADS')
              ? 'bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 text-slate-950 border-4 border-yellow-200 shadow-yellow-500/30'
              : 'bg-gradient-to-tr from-slate-300 via-zinc-100 to-slate-400 text-slate-900 border-4 border-white shadow-slate-300/30'
          }`}
          style={{ animationDuration: isFlipping ? '0.25s' : '0s' }}
        >
          {isFlipping ? '🪙' : coinResult ? (coinResult === 'HEADS' ? '👑' : '🦅') : selectedSide === 'HEADS' ? '👑' : '🦅'}
        </div>

        <div className="font-mono text-sm uppercase tracking-widest text-amber-300 font-bold mt-4">
          {isFlipping ? 'FLIPPING COIN...' : coinResult ? `LANDED: ${coinResult}` : `CHOICE: ${selectedSide}`}
        </div>

        <div className="min-h-[30px] mt-2 flex items-center justify-center text-center">
          {outcomeMessage && (
            <div
              className={`text-sm sm:text-base font-extrabold px-4 py-1.5 rounded-full border ${
                outcomeMessage.includes('WON')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {outcomeMessage}
            </div>
          )}
        </div>
      </div>

      {/* Side Selector */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={isFlipping}
          onClick={() => {
            setSelectedSide('HEADS');
            sounds.playChip();
          }}
          className={`p-4 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer ${
            selectedSide === 'HEADS'
              ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300 shadow-lg shadow-yellow-500/20 scale-102'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-2xl">👑</span>
          <span>BET HEADS</span>
        </button>

        <button
          type="button"
          disabled={isFlipping}
          onClick={() => {
            setSelectedSide('TAILS');
            sounds.playChip();
          }}
          className={`p-4 rounded-2xl border-2 font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer ${
            selectedSide === 'TAILS'
              ? 'border-zinc-300 bg-zinc-400/20 text-zinc-200 shadow-lg shadow-zinc-400/20 scale-102'
              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span className="text-2xl">🦅</span>
          <span>BET TAILS</span>
        </button>
      </div>

      {/* Bet Amounts & Flip Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Bet Amount:</span>
            <span className="font-mono text-amber-300 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {bets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={isFlipping}
                onClick={() => {
                  setBetAmount(b);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === b
                    ? 'bg-yellow-400 text-slate-950 shadow-md scale-105'
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
            disabled={isFlipping || user.balance < betAmount}
            onClick={handleFlip}
            className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 shadow-xl shadow-yellow-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isFlipping ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Coins className="w-5 h-5" />
                <span>FLIP COIN (${betAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
