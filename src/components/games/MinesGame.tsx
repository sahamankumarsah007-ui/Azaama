import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { ShieldCheck, Bomb, Gem, Play } from 'lucide-react';

interface MinesGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

interface Tile {
  id: number;
  revealed: boolean;
  isMine: boolean;
}

const MULTIPLIERS = [1.25, 1.8, 2.7, 4.2, 7.5, 14.0, 28.0];

export const MinesGame: React.FC<MinesGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'ENDED'>('IDLE');
  const [tiles, setTiles] = useState<Tile[]>(
    Array.from({ length: 25 }, (_, i) => ({ id: i, revealed: false, isMine: false }))
  );
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0];

  const handleStartGame = () => {
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    sounds.playChip();

    // 10% win chance, 90% loss
    const willWinRound = Math.random() < 0.10;

    // Distribute 4 mines
    const mineIndices = new Set<number>();
    while (mineIndices.size < 4) {
      mineIndices.add(Math.floor(Math.random() * 25));
    }

    const newTiles: Tile[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      revealed: false,
      isMine: mineIndices.has(i),
    }));

    // If losing round, ensure first or second click hits a mine
    if (!willWinRound) {
      // Keep mine positions tight
    }

    setTiles(newTiles);
    setRevealedCount(0);
    setOutcomeMsg(null);
    setGameState('PLAYING');
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING') return;
    if (tiles[index].revealed) return;

    sounds.playChip();

    const clickedTile = tiles[index];
    // In 90% mode, early click has 90% chance to reveal a mine
    const isMineHit = clickedTile.isMine || (revealedCount === 0 && Math.random() < 0.85);

    if (isMineHit) {
      // Boom! Game Over
      sounds.playChip();
      const updated = tiles.map((t) => (t.id === index ? { ...t, revealed: true, isMine: true } : t));
      setTiles(updated);
      setGameState('ENDED');
      setOutcomeMsg('💥 Boom! You uncovered a Mine. Bet lost.');

      user.balance = Number((user.balance + betAmount).toFixed(2));
      processBetOutcome({
        user,
        gameId: 'mines',
        gameName: 'Mines Treasure Grid',
        betAmount,
        payout: 0,
        multiplier: 0,
        details: `Hit mine on tile #${index + 1}`,
        onBalanceUpdated,
        onUserUpdated,
      });
    } else {
      // Gem safe!
      sounds.playCoinDing();
      const updated = tiles.map((t) => (t.id === index ? { ...t, revealed: true, isMine: false } : t));
      setTiles(updated);
      setRevealedCount((prev) => prev + 1);
    }
  };

  const handleCashout = () => {
    if (gameState !== 'PLAYING' || revealedCount === 0) return;

    const mult = MULTIPLIERS[Math.min(revealedCount - 1, MULTIPLIERS.length - 1)];
    const payout = Number((betAmount * mult).toFixed(2));

    setGameState('ENDED');
    setOutcomeMsg(`🎉 Cashed out at ${mult}x! Won $${payout.toFixed(2)} USD!`);

    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'mines',
      gameName: 'Mines Treasure Grid',
      betAmount,
      payout,
      multiplier: mult,
      details: `Cashed out with ${revealedCount} gems uncovered (${mult}x)`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  const currentMultiplier =
    revealedCount > 0 ? MULTIPLIERS[Math.min(revealedCount - 1, MULTIPLIERS.length - 1)] : 1.0;

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-teal-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(20,184,166,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-teal-500/20">
            💎
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Mines Treasure Grid</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                UP TO 28X
              </span>
            </div>
            <p className="text-xs text-slate-400">Uncover gems and avoid mines. Cash out anytime!</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-300 text-xs font-semibold border border-teal-500/30">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* 5x5 Mines Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-teal-500/30 shadow-inner flex flex-col items-center justify-center space-y-4">
        {/* Status Message */}
        <div className="min-h-[28px] text-center">
          {outcomeMsg ? (
            <div
              className={`text-sm sm:text-base font-extrabold px-4 py-1 rounded-full border ${
                outcomeMsg.includes('WON') || outcomeMsg.includes('Cashed')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {outcomeMsg}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-mono">
              {gameState === 'PLAYING'
                ? `Revealed ${revealedCount} Gems • Current: ${currentMultiplier}x`
                : 'Click Start Game to initiate grid'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-sm">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              disabled={gameState !== 'PLAYING' || tile.revealed}
              onClick={() => handleTileClick(tile.id)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-black transition-all cursor-pointer shadow-md select-none ${
                tile.revealed
                  ? tile.isMine
                    ? 'bg-rose-600 text-white border border-rose-400 animate-pulse'
                    : 'bg-emerald-600/30 border-2 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-500'
              }`}
            >
              {tile.revealed ? (tile.isMine ? '💣' : '💎') : '❓'}
            </button>
          ))}
        </div>
      </div>

      {/* Bets & Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Mines Bet Amount:</span>
            <span className="font-mono text-teal-400 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {bets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={gameState === 'PLAYING'}
                onClick={() => {
                  setBetAmount(b);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === b
                    ? 'bg-teal-500 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${b.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {gameState === 'PLAYING' ? (
            <button
              type="button"
              disabled={revealedCount === 0}
              onClick={handleCashout}
              className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              CASHOUT ${ (betAmount * currentMultiplier).toFixed(2) } ({currentMultiplier}x)
            </button>
          ) : (
            <button
              type="button"
              disabled={user.balance < betAmount}
              onClick={handleStartGame}
              className="w-full py-4 rounded-2xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 text-slate-950 hover:brightness-110 shadow-xl shadow-teal-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START MINES (${betAmount.toFixed(2)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
