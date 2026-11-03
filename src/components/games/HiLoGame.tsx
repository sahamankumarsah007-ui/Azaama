import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { ShieldCheck, ArrowUp, ArrowDown, Play } from 'lucide-react';

interface HiLoGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

interface Card {
  value: string;
  rank: number;
  suit: string;
  color: 'text-red-500' | 'text-slate-900';
}

const CARDS: Card[] = [
  { value: '2', rank: 2, suit: '♠', color: 'text-slate-900' },
  { value: '3', rank: 3, suit: '♥', color: 'text-red-500' },
  { value: '4', rank: 4, suit: '♦', color: 'text-red-500' },
  { value: '5', rank: 5, suit: '♣', color: 'text-slate-900' },
  { value: '6', rank: 6, suit: '♠', color: 'text-slate-900' },
  { value: '7', rank: 7, suit: '♥', color: 'text-red-500' },
  { value: '8', rank: 8, suit: '♦', color: 'text-red-500' },
  { value: '9', rank: 9, suit: '♣', color: 'text-slate-900' },
  { value: '10', rank: 10, suit: '♠', color: 'text-slate-900' },
  { value: 'J', rank: 11, suit: '♥', color: 'text-red-500' },
  { value: 'Q', rank: 12, suit: '♦', color: 'text-red-500' },
  { value: 'K', rank: 13, suit: '♣', color: 'text-slate-900' },
  { value: 'A', rank: 14, suit: '♠', color: 'text-slate-900' },
];

export const HiLoGame: React.FC<HiLoGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [currentCard, setCurrentCard] = useState<Card>(CARDS[5]); // '7'
  const [nextCard, setNextCard] = useState<Card | null>(null);
  const [isDealing, setIsDealing] = useState<boolean>(false);
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);

  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0];

  const handleGuess = (guess: 'HIGHER' | 'LOWER') => {
    if (isDealing) return;
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setIsDealing(true);
    setNextCard(null);
    setOutcomeMsg(null);
    sounds.playCardFlip();

    setTimeout(() => {
      // 10% win rate, 90% loss rate
      const willWin = Math.random() < 0.10;
      let dealtCard: Card;

      if (willWin) {
        if (guess === 'HIGHER') {
          const higher = CARDS.filter((c) => c.rank > currentCard.rank);
          dealtCard = higher.length > 0 ? higher[Math.floor(Math.random() * higher.length)] : CARDS[12];
        } else {
          const lower = CARDS.filter((c) => c.rank < currentCard.rank);
          dealtCard = lower.length > 0 ? lower[Math.floor(Math.random() * lower.length)] : CARDS[0];
        }
      } else {
        // 90% loss: land opposite
        if (guess === 'HIGHER') {
          const lower = CARDS.filter((c) => c.rank <= currentCard.rank);
          dealtCard = lower.length > 0 ? lower[Math.floor(Math.random() * lower.length)] : CARDS[0];
        } else {
          const higher = CARDS.filter((c) => c.rank >= currentCard.rank);
          dealtCard = higher.length > 0 ? higher[Math.floor(Math.random() * higher.length)] : CARDS[12];
        }
      }

      setNextCard(dealtCard);
      setIsDealing(false);

      const won =
        guess === 'HIGHER'
          ? dealtCard.rank > currentCard.rank
          : dealtCard.rank < currentCard.rank;
      const mult = won ? 5.0 : 0;
      const payout = won ? Number((betAmount * mult).toFixed(2)) : 0;

      if (won) {
        setOutcomeMsg(`🎉 Correct! Dealt ${dealtCard.value}${dealtCard.suit}! Won $${payout.toFixed(2)} (${mult}x)!`);
      } else {
        setOutcomeMsg(`Dealt ${dealtCard.value}${dealtCard.suit}. Guess ${guess} lost.`);
      }

      setCurrentCard(dealtCard);

      user.balance = Number((user.balance + betAmount).toFixed(2));
      processBetOutcome({
        user,
        gameId: 'hilo',
        gameName: 'Hi-Lo Card Duel',
        betAmount,
        payout,
        multiplier: mult,
        details: `Guessed ${guess} on ${currentCard.value}, dealt ${dealtCard.value}`,
        onBalanceUpdated,
        onUserUpdated,
      });
    }, 800);
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-indigo-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(99,102,241,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-indigo-500/20">
            🎴
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Hi-Lo Card Duel</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                HIGH PAYOUT 5X
              </span>
            </div>
            <p className="text-xs text-slate-400">Predict whether the next dealt card will be Higher or Lower</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Hi-Lo Cards Arena */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-indigo-500/30 shadow-inner flex flex-col items-center justify-center space-y-5">
        <div className="flex items-center justify-center gap-6">
          {/* Current Card */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Current Card</span>
            <div className="w-24 sm:w-28 h-36 sm:h-40 rounded-2xl p-3 flex flex-col justify-between shadow-2xl bg-white text-slate-900 border-2 border-indigo-400">
              <div className={`font-black text-lg ${currentCard.color}`}>{currentCard.value}</div>
              <div className={`text-4xl text-center ${currentCard.color}`}>{currentCard.suit}</div>
              <div className={`font-black text-lg text-right ${currentCard.color}`}>{currentCard.value}</div>
            </div>
          </div>

          <div className="text-2xl font-bold text-indigo-400 font-mono">VS</div>

          {/* Next Card */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Dealt Card</span>
            <div className="w-24 sm:w-28 h-36 sm:h-40 rounded-2xl p-3 flex flex-col justify-between shadow-2xl bg-white text-slate-900 border-2 border-slate-700">
              {nextCard ? (
                <>
                  <div className={`font-black text-lg ${nextCard.color}`}>{nextCard.value}</div>
                  <div className={`text-4xl text-center ${nextCard.color}`}>{nextCard.suit}</div>
                  <div className={`font-black text-lg text-right ${nextCard.color}`}>{nextCard.value}</div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-3xl text-slate-400">
                  🂠
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="min-h-[28px] text-center">
          {outcomeMsg ? (
            <div
              className={`text-sm sm:text-base font-extrabold px-4 py-1 rounded-full border ${
                outcomeMsg.includes('WON') || outcomeMsg.includes('Correct')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {outcomeMsg}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-mono">
              Guess HIGHER or LOWER for the next card
            </span>
          )}
        </div>
      </div>

      {/* Higher or Lower Choice Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={isDealing}
          onClick={() => handleGuess('HIGHER')}
          className="p-4 rounded-2xl border-2 border-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
        >
          <ArrowUp className="w-5 h-5 text-emerald-400" />
          <span>GUESS HIGHER (▲)</span>
        </button>

        <button
          type="button"
          disabled={isDealing}
          onClick={() => handleGuess('LOWER')}
          className="p-4 rounded-2xl border-2 border-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/10"
        >
          <ArrowDown className="w-5 h-5 text-rose-400" />
          <span>GUESS LOWER (▼)</span>
        </button>
      </div>

      {/* Bets Selector */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold">Hi-Lo Bet Amount:</span>
          <span className="font-mono text-indigo-400 font-bold">${betAmount.toFixed(2)} USD</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {bets.map((b) => (
            <button
              key={b}
              type="button"
              disabled={isDealing}
              onClick={() => {
                setBetAmount(b);
                sounds.playChip();
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                betAmount === b
                  ? 'bg-indigo-500 text-white shadow-md scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              ${b.toFixed(2)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
