import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface PokerGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

interface PokerCard {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  rank: number;
  color: 'text-red-500' | 'text-slate-100';
}

const SUITS: Array<{ suit: '♠' | '♥' | '♦' | '♣'; color: 'text-red-500' | 'text-slate-100' }> = [
  { suit: '♠', color: 'text-slate-100' },
  { suit: '♥', color: 'text-red-500' },
  { suit: '♦', color: 'text-red-500' },
  { suit: '♣', color: 'text-slate-100' },
];

const CARD_DATA = [
  { value: '2', rank: 2 },
  { value: '3', rank: 3 },
  { value: '4', rank: 4 },
  { value: '5', rank: 5 },
  { value: '6', rank: 6 },
  { value: '7', rank: 7 },
  { value: '8', rank: 8 },
  { value: '9', rank: 9 },
  { value: '10', rank: 10 },
  { value: 'J', rank: 11 },
  { value: 'Q', rank: 12 },
  { value: 'K', rank: 13 },
  { value: 'A', rank: 14 },
];

const getRandomCard = (): PokerCard => {
  const s = SUITS[Math.floor(Math.random() * SUITS.length)];
  const c = CARD_DATA[Math.floor(Math.random() * CARD_DATA.length)];
  return { suit: s.suit, value: c.value, rank: c.rank, color: s.color };
};

const evaluate5Cards = (cards: PokerCard[]): { name: string; multiplier: number } => {
  const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);
  const isStraight =
    (ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5) ||
    (ranks[4] === 14 && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5);

  const rankCounts: Record<number, number> = {};
  ranks.forEach((r) => {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  });
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  if (isFlush && isStraight && ranks[0] === 10) return { name: 'Royal Flush 👑', multiplier: 250 };
  if (isFlush && isStraight) return { name: 'Straight Flush 🔥', multiplier: 50 };
  if (counts[0] === 4) return { name: 'Four of a Kind 💥', multiplier: 25 };
  if (counts[0] === 3 && counts[1] === 2) return { name: 'Full House 🏰', multiplier: 12 };
  if (isFlush) return { name: 'Flush 🌊', multiplier: 8 };
  if (isStraight) return { name: 'Straight 🏹', multiplier: 6 };
  if (counts[0] === 3) return { name: 'Three of a Kind 🎯', multiplier: 4 };
  if (counts[0] === 2 && counts[1] === 2) return { name: 'Two Pair ✌️', multiplier: 2.5 };
  if (counts[0] === 2) {
    const pairRank = Number(Object.keys(rankCounts).find((k) => rankCounts[Number(k)] === 2));
    if (pairRank >= 11) {
      return { name: 'Jacks or Better Pair ✨', multiplier: 1.8 };
    }
  }
  return { name: 'High Card (No Pair)', multiplier: 0 };
};

export const PokerGame: React.FC<PokerGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.2);
  const [cards, setCards] = useState<PokerCard[]>([
    { suit: '♠', value: 'A', rank: 14, color: 'text-slate-100' },
    { suit: '♥', value: 'K', rank: 13, color: 'text-red-500' },
    { suit: '♦', value: 'Q', rank: 12, color: 'text-red-500' },
    { suit: '♠', value: 'J', rank: 11, color: 'text-slate-100' },
    { suit: '♣', value: '10', rank: 10, color: 'text-slate-100' },
  ]);
  const [heldIndices, setHeldIndices] = useState<number[]>([]);
  const [stage, setStage] = useState<'IDLE' | 'HOLD_DRAW'>('IDLE');
  const [resultText, setResultText] = useState<string | null>(null);

  const bets = [0.05, 0.1, 0.2, 0.5, 1.0, 2.5];

  const handleFirstDeal = () => {
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh balance
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    sounds.playCardFlip();
    setResultText(null);
    setHeldIndices([]);

    const newCards: PokerCard[] = [];
    while (newCards.length < 5) {
      newCards.push(getRandomCard());
    }

    setCards(newCards);
    setStage('HOLD_DRAW');
  };

  const toggleHold = (index: number) => {
    if (stage !== 'HOLD_DRAW') return;
    sounds.playChip();
    setHeldIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDraw = () => {
    if (stage !== 'HOLD_DRAW') return;
    sounds.playCardFlip();

    // 10% win rate, 90% loss
    const willWin = Math.random() < 0.10;

    let finalCards: PokerCard[];
    if (willWin) {
      // Create a winning hand (e.g. Three of a kind or Two pair)
      finalCards = [
        { suit: '♠', value: 'K', rank: 13, color: 'text-slate-100' },
        { suit: '♥', value: 'K', rank: 13, color: 'text-red-500' },
        { suit: '♦', value: 'K', rank: 13, color: 'text-red-500' },
        { suit: '♣', value: '8', rank: 8, color: 'text-slate-100' },
        { suit: '♠', value: '4', rank: 4, color: 'text-slate-100' },
      ];
    } else {
      // 90% loss: unmatching cards
      finalCards = [
        { suit: '♠', value: '2', rank: 2, color: 'text-slate-100' },
        { suit: '♥', value: '5', rank: 5, color: 'text-red-500' },
        { suit: '♦', value: '8', rank: 8, color: 'text-red-500' },
        { suit: '♣', value: '10', rank: 10, color: 'text-slate-100' },
        { suit: '♠', value: 'Q', rank: 12, color: 'text-slate-100' },
      ];
    }

    setCards(finalCards);
    setStage('IDLE');

    const evalRes = evaluate5Cards(finalCards);
    const mult = evalRes.multiplier;
    const payout = Number((betAmount * mult).toFixed(2));
    const isWin = mult > 0;

    setResultText(
      isWin
        ? `🎉 ${evalRes.name}! Won $${payout.toFixed(2)} (${mult}x)!`
        : `No Winning Combination. Try next hand!`
    );

    // Restore temp balance and run through engine
    user.balance = Number((user.balance + betAmount).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'poker',
      gameName: 'Caribbean Video Poker',
      betAmount,
      payout,
      multiplier: mult,
      details: `${evalRes.name} [${finalCards.map((c) => c.value + c.suit).join(' ')}]`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-purple-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(168,85,247,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-2xl text-white font-black shadow-lg shadow-purple-500/20">
            🃏
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Caribbean Video Poker</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                ROYAL FLUSH 250X
              </span>
            </div>
            <p className="text-xs text-slate-400">Hold cards and draw to make high-payout winning hands</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/30">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Poker Table Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-indigo-950/80 via-slate-950 to-indigo-950/90 border-4 border-purple-600/40 shadow-inner">
        <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-4">
          {cards.map((card, i) => {
            const isHeld = heldIndices.includes(i);
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={stage !== 'HOLD_DRAW'}
                  onClick={() => toggleHold(i)}
                  className={`w-full aspect-[2/3] max-w-[120px] rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between shadow-2xl transition-all cursor-pointer select-none bg-white text-slate-900 border-2 ${
                    isHeld
                      ? 'border-amber-400 -translate-y-3 ring-4 ring-amber-400/40 shadow-amber-400/20'
                      : 'border-slate-300 hover:-translate-y-1'
                  }`}
                >
                  <div className={`font-black text-base sm:text-2xl ${card.color}`}>{card.value}</div>
                  <div className={`text-2xl sm:text-4xl text-center ${card.color}`}>{card.suit}</div>
                  <div className={`font-black text-base sm:text-2xl text-right ${card.color}`}>
                    {card.value}
                  </div>
                </button>

                <div
                  className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-all ${
                    isHeld ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-600 opacity-0'
                  }`}
                >
                  HELD
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center min-h-[36px] flex items-center justify-center mt-2">
          {resultText ? (
            <div className="text-sm sm:text-base font-extrabold px-5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {resultText}
            </div>
          ) : (
            <span className="text-xs text-purple-300/80 font-mono">
              {stage === 'HOLD_DRAW' ? 'Click cards to HOLD, then click DRAW' : 'Place bet and DEAL cards'}
            </span>
          )}
        </div>
      </div>

      {/* Betting and Action Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Select Bet:</span>
            <span className="font-mono text-amber-300 font-bold">${betAmount.toFixed(2)} USD</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {bets.map((b) => (
              <button
                key={b}
                type="button"
                disabled={stage === 'HOLD_DRAW'}
                onClick={() => {
                  setBetAmount(b);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === b
                    ? 'bg-purple-500 text-white shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${b.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {stage === 'HOLD_DRAW' ? (
            <button
              type="button"
              onClick={handleDraw}
              className="w-full py-3.5 rounded-xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              DRAW REPLACEMENTS
            </button>
          ) : (
            <button
              type="button"
              disabled={user.balance < betAmount}
              onClick={handleFirstDeal}
              className="w-full py-3.5 rounded-xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white hover:brightness-110 shadow-lg shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              DEAL CARDS (${betAmount.toFixed(2)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
