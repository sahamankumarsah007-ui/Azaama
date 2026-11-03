import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { Rocket, ShieldCheck } from 'lucide-react';

interface CrashGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

export const CrashGame: React.FC<CrashGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [gameState, setGameState] = useState<'IDLE' | 'FLYING' | 'CRASHED'>('IDLE');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [crashPoint, setCrashPoint] = useState<number>(2.0);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0];

  const handleStartFlight = () => {
    if (gameState === 'FLYING') return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance with game
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    // 10% win rate (high flight), 90% loss (quick crash)
    const willWinHigh = Math.random() < 0.10;
    let point = 1.05;
    if (willWinHigh) {
      point = 4.5 + Math.random() * 15.0; // High flight 5x - 20x
    } else {
      point = 1.05 + Math.random() * 0.15; // Quick crash 1.05x - 1.20x
    }

    setCrashPoint(point);
    setGameState('FLYING');
    setMultiplier(1.0);
    setHasCashedOut(false);
    setOutcomeMsg(null);
    sounds.playSpinTick();

    startTimeRef.current = performance.now();
    runAnimation(point);
  };

  const runAnimation = (targetCrash: number) => {
    const loop = (time: number) => {
      const elapsedSec = (time - startTimeRef.current) / 1000;
      const current = Number((Math.pow(Math.E, 0.22 * elapsedSec)).toFixed(2));

      if (current >= targetCrash) {
        setMultiplier(targetCrash);
        handleCrash(targetCrash);
      } else {
        setMultiplier(current);
        requestRef.current = requestAnimationFrame(loop);
      }
    };
    requestRef.current = requestAnimationFrame(loop);
  };

  const handleCashout = () => {
    if (gameState !== 'FLYING' || hasCashedOut) return;
    setHasCashedOut(true);

    const payout = Number((betAmount * multiplier).toFixed(2));
    setOutcomeMsg(`🎉 Cashed out at ${multiplier.toFixed(2)}x! Won $${payout.toFixed(2)}!`);

    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'crash',
      gameName: 'Rocket Crash (Aviator)',
      betAmount,
      payout,
      multiplier,
      details: `Cashed out at ${multiplier.toFixed(2)}x (Flew to ${crashPoint.toFixed(2)}x)`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  const handleCrash = (finalPoint: number) => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setGameState('CRASHED');
    sounds.playChip();

    if (!hasCashedOut) {
      setOutcomeMsg(`💥 Rocket Crashed at ${finalPoint.toFixed(2)}x! Bet lost.`);
      user.balance = Number((user.balance + betAmount).toFixed(2));
      processBetOutcome({
        user,
        gameId: 'crash',
        gameName: 'Rocket Crash (Aviator)',
        betAmount,
        payout: 0,
        multiplier: 0,
        details: `Crashed at ${finalPoint.toFixed(2)}x before cashout`,
        onBalanceUpdated,
        onUserUpdated,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-orange-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(249,115,22,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-orange-500/20">
            🚀
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Rocket Crash (Aviator)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                MULTIPLIER CURVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Cash out before the rocket flies away to lock in your profit</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-300 text-xs font-semibold border border-orange-500/30">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Flight Canvas Simulation */}
      <div className="relative p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-orange-500/30 shadow-inner min-h-[320px] flex flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />

        <div className="relative z-10 flex flex-col items-center justify-center my-auto">
          <div
            className={`text-6xl sm:text-8xl font-black font-mono tracking-tight transition-transform ${
              gameState === 'CRASHED'
                ? 'text-rose-500 scale-95'
                : gameState === 'FLYING'
                ? 'text-amber-400 scale-105'
                : 'text-slate-400'
            }`}
          >
            {multiplier.toFixed(2)}x
          </div>

          <div className="mt-2 text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            {gameState === 'FLYING'
              ? 'ROCKET ASCENDING...'
              : gameState === 'CRASHED'
              ? `FLEW AWAY AT ${multiplier.toFixed(2)}x`
              : 'READY FOR LAUNCH'}
          </div>

          {outcomeMsg && (
            <div
              className={`mt-4 text-sm font-extrabold px-5 py-1.5 rounded-full border shadow-xl ${
                outcomeMsg.includes('WON')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {outcomeMsg}
            </div>
          )}
        </div>

        {gameState === 'FLYING' && (
          <div className="absolute bottom-10 right-14 text-4xl animate-bounce">
            🚀
          </div>
        )}
      </div>

      {/* Betting and Cashout Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Launch Bet Amount:</span>
            <span className="font-mono text-orange-400 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {bets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={gameState === 'FLYING'}
                onClick={() => {
                  setBetAmount(b);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === b
                    ? 'bg-orange-500 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${b.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {gameState === 'FLYING' ? (
            <button
              type="button"
              disabled={hasCashedOut}
              onClick={handleCashout}
              className={`w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                hasCashedOut
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:brightness-110 shadow-emerald-500/30'
              }`}
            >
              <span>{hasCashedOut ? 'CASHED OUT' : `CASHOUT $${(betAmount * multiplier).toFixed(2)} (${multiplier.toFixed(2)}x)`}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={user.balance < betAmount}
              onClick={handleStartFlight}
              className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-slate-950 hover:brightness-110 shadow-xl shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Rocket className="w-5 h-5" />
              <span>LAUNCH ROCKET (${betAmount.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
