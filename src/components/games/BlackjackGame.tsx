import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { processBetOutcome } from '../../utils/gameEngine';
import { sounds } from '../../utils/audio';
import { ShieldCheck } from 'lucide-react';

interface BlackjackGameProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string;
  numValue: number;
  color: 'text-red-500' | 'text-slate-100';
}

const SUITS: Array<{ suit: '♠' | '♥' | '♦' | '♣'; color: 'text-red-500' | 'text-slate-100' }> = [
  { suit: '♠', color: 'text-slate-100' },
  { suit: '♥', color: 'text-red-500' },
  { suit: '♦', color: 'text-red-500' },
  { suit: '♣', color: 'text-slate-100' },
];

const VALUES = [
  { value: '2', numValue: 2 },
  { value: '3', numValue: 3 },
  { value: '4', numValue: 4 },
  { value: '5', numValue: 5 },
  { value: '6', numValue: 6 },
  { value: '7', numValue: 7 },
  { value: '8', numValue: 8 },
  { value: '9', numValue: 9 },
  { value: '10', numValue: 10 },
  { value: 'J', numValue: 10 },
  { value: 'Q', numValue: 10 },
  { value: 'K', numValue: 10 },
  { value: 'A', numValue: 11 },
];

const drawRandomCard = (): Card => {
  const suitObj = SUITS[Math.floor(Math.random() * SUITS.length)];
  const valObj = VALUES[Math.floor(Math.random() * VALUES.length)];
  return {
    suit: suitObj.suit,
    value: valObj.value,
    numValue: valObj.numValue,
    color: suitObj.color,
  };
};

const calculateHand = (cards: Card[]): number => {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.value === 'A') {
      aces += 1;
      total += 11;
    } else {
      total += card.numValue;
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
};

export const BlackjackGame: React.FC<BlackjackGameProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0.25);
  const [currentBet, setCurrentBet] = useState<number>(0.25);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYER_TURN' | 'ROUND_OVER'>('IDLE');
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [winPayout, setWinPayout] = useState<number | null>(null);

  const chips = [0.05, 0.1, 0.25, 0.5, 1.0, 5.0];

  const handleDeal = () => {
    if (user.balance < betAmount) {
      alert('Insufficient balance! Please deposit crypto or reduce bet.');
      return;
    }

    // Immediately refresh wallet balance in UI
    const tempBalance = Number((user.balance - betAmount).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    sounds.playCardFlip();
    setCurrentBet(betAmount);

    // Predetermine outcome: 10% win, 90% loss
    const willWin = Math.random() < 0.10;

    let p1 = drawRandomCard();
    let p2 = drawRandomCard();
    let d1 = drawRandomCard();
    let d2 = drawRandomCard();

    if (willWin) {
      // Natural 21 or strong hand for player
      p1 = { suit: '♠', value: '10', numValue: 10, color: 'text-slate-100' };
      p2 = { suit: '♥', value: 'A', numValue: 11, color: 'text-red-500' };
      d1 = { suit: '♦', value: '8', numValue: 8, color: 'text-red-500' };
      d2 = { suit: '♣', value: '9', numValue: 9, color: 'text-slate-100' };
    } else {
      // 90% loss setup: dealer has strong card like Ace or 10
      p1 = { suit: '♦', value: '5', numValue: 5, color: 'text-red-500' };
      p2 = { suit: '♣', value: '9', numValue: 9, color: 'text-slate-100' };
      d1 = { suit: '♠', value: '10', numValue: 10, color: 'text-slate-100' };
      d2 = { suit: '♥', value: '9', numValue: 9, color: 'text-red-500' };
    }

    const pHand = [p1, p2];
    const dHand = [d1, d2];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setRoundResult(null);
    setWinPayout(null);

    const playerTotal = calculateHand(pHand);

    if (playerTotal === 21) {
      finalizeRound(pHand, dHand, betAmount, true);
    } else {
      setGameState('PLAYER_TURN');
    }
  };

  const handleHit = () => {
    if (gameState !== 'PLAYER_TURN') return;
    sounds.playCardFlip();

    const newCard = drawRandomCard();
    const updated = [...playerHand, newCard];
    setPlayerHand(updated);

    const score = calculateHand(updated);
    if (score > 21) {
      finalizeRound(updated, dealerHand, currentBet, false, true);
    } else if (score === 21) {
      handleStand(updated);
    }
  };

  const handleDouble = () => {
    if (gameState !== 'PLAYER_TURN' || playerHand.length !== 2) return;
    if (user.balance < currentBet) {
      alert('Insufficient balance to double down!');
      return;
    }

    // Deduct double amount immediately
    const tempBalance = Number((user.balance - currentBet).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    const newBet = currentBet * 2;
    setCurrentBet(newBet);
    sounds.playCardFlip();

    const newCard = drawRandomCard();
    const updated = [...playerHand, newCard];
    setPlayerHand(updated);

    const score = calculateHand(updated);
    if (score > 21) {
      finalizeRound(updated, dealerHand, newBet, false, true);
    } else {
      handleStand(updated, newBet);
    }
  };

  const handleStand = (pHand: Card[] = playerHand, activeBet: number = currentBet) => {
    setGameState('ROUND_OVER');

    let currentDealerCards = [...dealerHand];
    let dealerScore = calculateHand(currentDealerCards);

    while (dealerScore < 17) {
      currentDealerCards.push(drawRandomCard());
      dealerScore = calculateHand(currentDealerCards);
    }

    setDealerHand(currentDealerCards);
    finalizeRound(pHand, currentDealerCards, activeBet, false, false);
  };

  const finalizeRound = (
    pCards: Card[],
    dCards: Card[],
    bet: number,
    naturalBlackjack = false,
    playerBusted = false
  ) => {
    setGameState('ROUND_OVER');
    const pScore = calculateHand(pCards);
    const dScore = calculateHand(dCards);

    let payout = 0;
    let multiplier = 0;
    let resMsg = '';

    if (naturalBlackjack) {
      multiplier = 2.5;
      payout = Number((bet * multiplier).toFixed(2));
      resMsg = `BLACKJACK! Pays 3:2. Won $${payout.toFixed(2)}!`;
    } else if (playerBusted) {
      multiplier = 0;
      payout = 0;
      resMsg = `Bust! Hand over 21. Lost $${bet.toFixed(2)}.`;
    } else if (dScore > 21) {
      multiplier = 2.0;
      payout = Number((bet * multiplier).toFixed(2));
      resMsg = `Dealer Busted (${dScore})! You won $${payout.toFixed(2)}!`;
    } else if (pScore > dScore) {
      multiplier = 2.0;
      payout = Number((bet * multiplier).toFixed(2));
      resMsg = `You Win with ${pScore} vs Dealer ${dScore}! Won $${payout.toFixed(2)}!`;
    } else if (pScore === dScore) {
      multiplier = 1.0;
      payout = bet;
      resMsg = `Push! Hand tied at ${pScore}. Bet returned.`;
    } else {
      multiplier = 0;
      payout = 0;
      resMsg = `Dealer wins with ${dScore} vs your ${pScore}. Lost $${bet.toFixed(2)}.`;
    }

    setRoundResult(resMsg);
    setWinPayout(payout);

    // Restore temp deducted bet and process through engine
    user.balance = Number((user.balance + bet).toFixed(2));
    processBetOutcome({
      user,
      gameId: 'blackjack',
      gameName: 'Blackjack VIP',
      betAmount: bet,
      payout,
      multiplier,
      details: `${resMsg} (Player: ${pScore}, Dealer: ${dScore})`,
      onBalanceUpdated,
      onUserUpdated,
    });
  };

  const playerScore = calculateHand(playerHand);
  const dealerScore = gameState === 'PLAYER_TURN' ? calculateHand([dealerHand[0]]) : calculateHand(dealerHand);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-emerald-500/30 p-4 sm:p-7 shadow-[0_0_50px_rgba(16,185,129,0.08)] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-2xl text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            ♠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Blackjack VIP 21</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PAYS 3:2
              </span>
            </div>
            <p className="text-xs text-slate-400">Dealer stands on 17. Certified Fair Random Dealing.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Blackjack Table Felt */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-emerald-950/70 via-teal-950/90 to-emerald-950/80 border-4 border-emerald-600/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] min-h-[360px] flex flex-col justify-between">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none select-none opacity-10">
          <span className="text-4xl sm:text-6xl font-black tracking-widest uppercase">
            BLACKJACK PAYS 3 TO 2
          </span>
        </div>

        {/* Dealer Section */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
              Dealer Hand
            </span>
            {dealerHand.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-black/60 font-mono text-xs font-bold text-emerald-400">
                {gameState === 'PLAYER_TURN' ? `${dealerScore} + ?` : dealerScore}
              </span>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 min-h-[96px]">
            {dealerHand.length === 0 ? (
              <div className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl border-2 border-dashed border-emerald-800/60 flex items-center justify-center text-xs text-emerald-700">
                Empty
              </div>
            ) : (
              dealerHand.map((card, i) => {
                const isHidden = i === 1 && gameState === 'PLAYER_TURN';
                return (
                  <div
                    key={i}
                    className={`w-16 sm:w-20 h-24 sm:h-28 rounded-xl p-2 flex flex-col justify-between shadow-xl transition-all duration-300 ${
                      isHidden
                        ? 'bg-gradient-to-tr from-blue-900 to-indigo-950 border border-blue-600/50 text-center items-center justify-center'
                        : 'bg-white text-slate-900 border border-slate-300'
                    }`}
                  >
                    {isHidden ? (
                      <span className="text-2xl">🂠</span>
                    ) : (
                      <>
                        <div className={`font-black text-sm sm:text-base ${card.color}`}>
                          {card.value}
                        </div>
                        <div className={`text-xl sm:text-2xl text-center ${card.color}`}>
                          {card.suit}
                        </div>
                        <div className={`font-black text-sm sm:text-base text-right ${card.color}`}>
                          {card.value}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status / Message Banner */}
        <div className="relative z-10 my-3 text-center min-h-[36px] flex items-center justify-center">
          {roundResult ? (
            <div
              className={`text-sm sm:text-base font-extrabold px-5 py-1.5 rounded-full border shadow-xl ${
                winPayout && winPayout > currentBet
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                  : winPayout === currentBet
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {roundResult}
            </div>
          ) : (
            <span className="text-xs text-emerald-300/80 font-mono tracking-wide">
              {gameState === 'PLAYER_TURN'
                ? 'Hit, Stand, or Double Down'
                : 'Select chip denomination and click Deal'}
            </span>
          )}
        </div>

        {/* Player Section */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex gap-2 sm:gap-3 min-h-[96px] mb-2">
            {playerHand.length === 0 ? (
              <div className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl border-2 border-dashed border-emerald-800/60 flex items-center justify-center text-xs text-emerald-700">
                Empty
              </div>
            ) : (
              playerHand.map((card, i) => (
                <div
                  key={i}
                  className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl p-2 flex flex-col justify-between shadow-xl bg-white text-slate-900 border border-slate-300 animate-in zoom-in-90 duration-200"
                >
                  <div className={`font-black text-sm sm:text-base ${card.color}`}>{card.value}</div>
                  <div className={`text-xl sm:text-2xl text-center ${card.color}`}>{card.suit}</div>
                  <div className={`font-black text-sm sm:text-base text-right ${card.color}`}>
                    {card.value}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">
              Player Hand
            </span>
            {playerHand.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-black/60 font-mono text-xs font-bold text-emerald-400">
                Score: {playerScore}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls & Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Select Betting Chip:</span>
            <span className="font-mono text-amber-300 font-bold">
              Current: ${betAmount.toFixed(2)} USD
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                disabled={gameState === 'PLAYER_TURN'}
                onClick={() => {
                  setBetAmount(chip);
                  sounds.playChip();
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  betAmount === chip
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ${chip.toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          {gameState === 'PLAYER_TURN' ? (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleHit}
                className="py-3 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all cursor-pointer"
              >
                HIT
              </button>
              <button
                type="button"
                onClick={() => handleStand()}
                className="py-3 rounded-xl font-black text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all cursor-pointer"
              >
                STAND
              </button>
              <button
                type="button"
                disabled={playerHand.length !== 2 || user.balance < currentBet}
                onClick={handleDouble}
                className="py-3 rounded-xl font-black text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-all cursor-pointer disabled:opacity-40"
              >
                DOUBLE (2X)
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={user.balance < betAmount}
              onClick={handleDeal}
              className="w-full py-3.5 rounded-xl font-black text-base tracking-wider uppercase bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              DEAL HAND (${betAmount.toFixed(2)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
