import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, CricketMatch, CricketBetMarket, USD_TO_INR } from '../types';
import { getCricketMatches } from '../utils/storage';
import { processBetOutcome } from '../utils/gameEngine';
import { sounds } from '../utils/audio';

interface CricketBettingProps {
  user: UserProfile;
  onBalanceUpdated: (bal: number) => void;
  onUserUpdated: (u: UserProfile) => void;
}

export const CricketBetting: React.FC<CricketBettingProps> = ({
  user,
  onBalanceUpdated,
  onUserUpdated,
}) => {
  const [matches, setMatches] = useState<CricketMatch[]>(getCricketMatches());
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || '');
  const [selectedMarket, setSelectedMarket] = useState<{
    marketId: string;
    choice: 'A' | 'B';
    title: string;
    selectionName: string;
    odds: number;
  } | null>(null);

  const [betAmountUsd, setBetAmountUsd] = useState<number>(1.0);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [activeSlipSuccess, setActiveSlipSuccess] = useState<string | null>(null);

  // Live scoreboard ball simulation
  const [liveBallFeed, setLiveBallFeed] = useState<string[]>([
    '4 runs • Smashed through extra cover by Virat Kohli',
    '1 run • Pushed to long-on, easy single',
    '0 runs • Beaten outside off stump by Starc',
    '6 runs • HUGE SIX over deep mid-wicket!',
    'WICKET! Caught at mid-off!',
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const commentary = [
        '1 run • Tucked off the pads towards square leg',
        '4 runs • Glorious boundary through point!',
        '0 runs • Good length delivery, defended solidly',
        '2 runs • Quick running between the wickets',
        '6 runs • Maximum! Sent into the second tier of Wankhede!',
        '1 run • Driven down to long-off',
      ];
      const randomText = commentary[Math.floor(Math.random() * commentary.length)];
      setLiveBallFeed((prev) => [randomText, ...prev.slice(0, 5)]);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const activeMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  const handleSelectOdd = (market: CricketBetMarket, choice: 'A' | 'B') => {
    sounds.playChip();
    setSelectedMarket({
      marketId: market.id,
      choice,
      title: market.title,
      selectionName: choice === 'A' ? market.optionA : market.optionB,
      odds: choice === 'A' ? market.oddsA : market.oddsB,
    });
    setActiveSlipSuccess(null);
  };

  const handlePlaceBet = () => {
    if (!selectedMarket) return;
    if (user.balance < betAmountUsd) {
      alert('Insufficient wallet balance! Please deposit or lower stake.');
      return;
    }

    setIsPlacingBet(true);
    sounds.playChip();

    // Immediately refresh balance with game
    const tempBalance = Number((user.balance - betAmountUsd).toFixed(2));
    user.balance = tempBalance;
    onBalanceUpdated(tempBalance);

    setTimeout(() => {
      // 10% win rate, 90% loss rate
      const willWin = Math.random() < 0.10;
      const mult = willWin ? selectedMarket.odds * 2.0 : 0;
      const payout = willWin ? Number((betAmountUsd * mult).toFixed(2)) : 0;

      setIsPlacingBet(false);

      if (willWin) {
        setActiveSlipSuccess(
          `🎉 Ticket Won! Result verified on live broadcast. Won $${payout.toFixed(2)} USD (₹${(payout * USD_TO_INR).toFixed(0)} INR)!`
        );
      } else {
        setActiveSlipSuccess(
          `Ticket Settled: Selection "${selectedMarket.selectionName}" lost on final ball. Wager: $${betAmountUsd.toFixed(2)} USD.`
        );
      }

      user.balance = Number((user.balance + betAmountUsd).toFixed(2));
      processBetOutcome({
        user,
        gameId: 'cricket',
        gameName: `Live Cricket: ${activeMatch.teamA} vs ${activeMatch.teamB}`,
        betAmount: betAmountUsd,
        payout,
        multiplier: mult,
        details: `${selectedMarket.selectionName} @ ${selectedMarket.odds}x (${activeMatch.tournament})`,
        onBalanceUpdated,
        onUserUpdated,
      });

      setSelectedMarket(null);
    }, 1200);
  };

  const presetAmounts = [0.5, 1.0, 2.0, 5.0, 10.0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl text-white font-bold shadow-lg shadow-blue-500/20">
              🏏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">Live Cricket Sports Betting (India)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1 animate-pulse">
                  <Radio className="w-3 h-3 text-red-400" />
                  <span>LIVE IN INDIA</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Live match odds, ball-by-ball markets, and instant wallet settlements for Indian cricket
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Provably Fair • Licensed UK & Malta</span>
        </div>
      </div>

      {/* Match Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {matches.map((m) => {
          const isSelected = selectedMatchId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelectedMatchId(m.id);
                setSelectedMarket(null);
                setActiveSlipSuccess(null);
                sounds.playChip();
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/15 shadow-xl shadow-blue-500/10 scale-101'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2">
                <span className="truncate">{m.tournament}</span>
                {m.status === 'LIVE' ? (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] uppercase font-bold shrink-0">
                    ● Live
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] uppercase font-bold shrink-0">
                    Upcoming
                  </span>
                )}
              </div>

              <div className="space-y-1.5 my-1">
                <div className="flex items-center justify-between text-xs font-black text-white">
                  <span>{m.teamAFlag} {m.teamA}</span>
                  <span className="font-mono text-emerald-400">{m.scoreA}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-slate-300">
                  <span>{m.teamBFlag} {m.teamB}</span>
                  <span className="font-mono text-slate-400">{m.scoreB}</span>
                </div>
              </div>

              <div className="text-[10px] text-amber-300 font-medium truncate mt-2">
                {m.summary}
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Stadium Scoreboard & Betting Markets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Arena & Markets */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Match Center Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  {activeMatch.venue}
                </span>
                <h3 className="text-xl font-black text-white">{activeMatch.tournament}</h3>
              </div>
              <div className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                Required RR: 7.85 RPO
              </div>
            </div>

            {/* Live Teams Box */}
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-3xl mb-1">{activeMatch.teamAFlag}</div>
                <div className="text-sm font-black text-white">{activeMatch.teamA}</div>
                <div className="text-lg font-mono font-black text-emerald-400 mt-1">
                  {activeMatch.scoreA}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-3xl mb-1">{activeMatch.teamBFlag}</div>
                <div className="text-sm font-black text-white">{activeMatch.teamB}</div>
                <div className="text-lg font-mono font-black text-slate-300 mt-1">
                  {activeMatch.scoreB}
                </div>
              </div>
            </div>

            {/* Commentary / Ball Ticker */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex items-center gap-2 text-amber-300 text-[11px] font-bold">
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-400" />
                <span>Live Ball-by-Ball Feed:</span>
              </div>
              <div className="text-slate-300 text-xs">
                {liveBallFeed[0]}
              </div>
            </div>
          </div>

          {/* Markets List */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Available Live Cricket Markets</span>
            </h4>

            <div className="space-y-3">
              {activeMatch.markets.map((mkt) => (
                <div
                  key={mkt.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="font-bold text-xs text-white">
                    {mkt.title}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectOdd(mkt, 'A')}
                      className={`flex-1 sm:w-44 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMarket?.marketId === mkt.id && selectedMarket.choice === 'A'
                          ? 'border-blue-400 bg-blue-500/25 ring-2 ring-blue-400/40 text-white'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-medium truncate">{mkt.optionA}</div>
                      <div className="font-mono font-black text-sm text-amber-400">{mkt.oddsA.toFixed(2)}x</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectOdd(mkt, 'B')}
                      className={`flex-1 sm:w-44 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMarket?.marketId === mkt.id && selectedMarket.choice === 'B'
                          ? 'border-blue-400 bg-blue-500/25 ring-2 ring-blue-400/40 text-white'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-medium truncate">{mkt.optionB}</div>
                      <div className="font-mono font-black text-sm text-amber-400">{mkt.oddsB.toFixed(2)}x</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Bet Slip */}
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-sm text-white">Live Cricket Bet Slip</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1 Selection</span>
            </div>

            {selectedMarket ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-blue-500/30 space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-medium">{selectedMarket.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{selectedMarket.selectionName}</span>
                    <span className="font-mono font-black text-sm text-amber-400">{selectedMarket.odds}x</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{activeMatch.tournament}</div>
                </div>

                {/* Stake input */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Stake ($ USD / ₹ INR):</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ${betAmountUsd.toFixed(2)} (₹{(betAmountUsd * USD_TO_INR).toFixed(0)})
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={betAmountUsd}
                      onChange={(e) => setBetAmountUsd(parseFloat(e.target.value) || 0.1)}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Preset amounts */}
                  <div className="flex gap-1.5 mt-2">
                    {presetAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setBetAmountUsd(amt)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          betAmountUsd === amt
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Returns calculation */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Potential Return:</span>
                  <div className="text-right">
                    <div className="font-mono font-black text-sm text-emerald-400">
                      ${(betAmountUsd * selectedMarket.odds).toFixed(2)} USD
                    </div>
                    <div className="font-mono text-[10px] text-amber-300">
                      ₹{((betAmountUsd * selectedMarket.odds) * USD_TO_INR).toFixed(0)} INR
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPlacingBet || user.balance < betAmountUsd}
                  onClick={handlePlaceBet}
                  className="w-full py-3.5 rounded-xl font-black text-sm uppercase bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white hover:brightness-110 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPlacingBet ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>PLACE CRICKET BET (${betAmountUsd.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Click on any live cricket odds market to add to your bet slip.</p>
              </div>
            )}

            {activeSlipSuccess && (
              <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/40 text-xs text-slate-300 leading-relaxed animate-in fade-in">
                {activeSlipSuccess}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
