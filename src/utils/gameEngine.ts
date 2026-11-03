import { UserProfile, BetActivity } from '../types';
import { setCurrentUser, addActivity, addPushNotification } from './storage';
import { sounds } from './audio';
import confetti from 'canvas-confetti';

export interface ProcessBetResultParams {
  user: UserProfile;
  gameId: string;
  gameName: string;
  betAmount: number;
  payout: number; // 0 if loss, > 0 if win or push
  multiplier: number;
  details?: string;
  onBalanceUpdated: (newBalance: number) => void;
  onUserUpdated: (updatedUser: UserProfile) => void;
}

export const processBetOutcome = ({
  user,
  gameId,
  gameName,
  betAmount,
  payout,
  multiplier,
  details,
  onBalanceUpdated,
  onUserUpdated,
}: ProcessBetResultParams): { profit: number; outcome: 'WIN' | 'LOSS' | 'PUSH' } => {
  const profit = Number((payout - betAmount).toFixed(2));
  const outcome: 'WIN' | 'LOSS' | 'PUSH' =
    payout > betAmount ? 'WIN' : payout === betAmount ? 'PUSH' : 'LOSS';

  // Calculate new balance
  // Note: the bet amount was either already deducted or is netted here
  const newBalance = Number((user.balance - betAmount + payout).toFixed(2));
  user.balance = Math.max(0, newBalance);

  // Update statistics
  const stats = { ...user.stats };
  stats.totalBets += 1;
  stats.totalWagered = Number((stats.totalWagered + betAmount).toFixed(2));
  stats.totalWon = Number((stats.totalWon + payout).toFixed(2));
  stats.netProfit = Number((stats.netProfit + profit).toFixed(2));

  if (outcome === 'WIN') {
    stats.wins += 1;
    if (profit > stats.biggestWin) {
      stats.biggestWin = profit;
    }
  } else if (outcome === 'LOSS') {
    stats.losses += 1;
  }

  // Update favorite game
  stats.favoriteGame = gameName;
  user.stats = stats;

  // Persist updated user
  setCurrentUser(user);
  onBalanceUpdated(user.balance);
  onUserUpdated(user);

  // Record bet activity
  const activity: BetActivity = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    username: user.username,
    gameId,
    gameName,
    betAmount,
    payout,
    profit,
    multiplier,
    outcome,
    timestamp: new Date().toISOString(),
    details,
  };
  addActivity(activity);

  // Audio & Celebrations
  if (outcome === 'WIN') {
    if (multiplier >= 5 || profit >= 5) {
      sounds.playJackpot();
      // Blast confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
        });
      } catch {
        // ignore if not supported
      }
    } else {
      sounds.playWin();
    }

    // Push notification for win
    addPushNotification({
      id: 'notif_win_' + Date.now(),
      title: `🎉 ${gameName} Win!`,
      message: `You won $${payout.toFixed(2)} (${multiplier.toFixed(2)}x) with a $${betAmount.toFixed(2)} bet!`,
      amount: profit,
      type: 'WIN',
      timestamp: new Date().toISOString(),
      read: false,
    });
  } else if (outcome === 'LOSS') {
    sounds.playChip();
  }

  return { profit, outcome };
};
