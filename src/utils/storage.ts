import {
  UserProfile,
  Transaction,
  BetActivity,
  PushNotification,
  Tournament,
  LeaderboardPlayer,
  WELCOME_BONUS_USD,
  PREDEFINED_AVATARS,
  CricketMatch,
} from '../types';
import { sounds } from './audio';

export const ADMIN_PASSWORD = 'Amankumar007';
export const ADMIN_SECURITY_CODE = '0079';

const STORAGE_KEYS = {
  CURRENT_USER: 'small_casino_current_user_v3',
  USERS_LIST: 'small_casino_users_v3',
  TRANSACTIONS: 'small_casino_txs_v3',
  ACTIVITIES: 'small_casino_activities_v3',
  NOTIFICATIONS: 'small_casino_notifs_v3',
  CRICKET_MATCHES: 'small_casino_cricket_v3',
};

// Master Admin account with the credentials requested by user
export const DEFAULT_ADMIN: UserProfile = {
  id: 'admin_master_001',
  username: 'CasinoAdmin',
  email: 'admin@smallcasino.com',
  avatarId: 'high_roller',
  bio: 'Official Small Casino Master Administrator & Treasury',
  balance: 50000.0,
  registeredAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  bonusClaimed: true,
  isAdmin: true,
  stats: {
    wins: 1420,
    losses: 1200,
    totalBets: 2620,
    totalWagered: 154000,
    totalWon: 162500,
    biggestWin: 2450.0,
    netProfit: 8500.0,
    favoriteGame: 'Blackjack',
  },
};

// Seed initial transactions including INR UPI
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_seed_101',
    userId: 'admin_master_001',
    username: 'CasinoAdmin',
    type: 'DEPOSIT',
    currency: 'INR_UPI',
    amount: 25.0, // ≈ ₹2,150 INR
    address: 'amankumarsah@fam',
    txHash: 'UPI/314987291039/UTR',
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    processedAt: new Date(Date.now() - 3600000 * 4 + 2000).toISOString(),
    statusLogs: [
      {
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        message: 'Deposit via UPI to amankumarsah@fam received with UTR: 314987291039',
        state: 'DETECTED',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 4 + 2000).toISOString(),
        message: 'Instant automated verification passed. Credited to wallet balance.',
        state: 'CONFIRMED',
      },
    ],
  },
  {
    id: 'tx_seed_102',
    userId: 'sample_user_02',
    username: 'LuckyVegas',
    type: 'WITHDRAWAL',
    currency: 'INR_UPI',
    amount: 12.0, // ≈ ₹1,038 INR
    address: 'amankumarsah@fam',
    txHash: 'wdr_inr_' + Date.now(),
    status: 'PENDING_APPROVAL',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    statusLogs: [
      {
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        message: 'Withdrawal request for $12.00 USD (₹1,038 INR) submitted to UPI.',
        state: 'PENDING',
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 1 + 1000).toISOString(),
        message: 'Queue assigned: Admin manual verification (Est. 3 to 5 hours wait time).',
        state: 'WAITING_3_TO_5_HOURS',
      },
    ],
  },
];

export const getStoredUsers = (): Record<string, UserProfile & { passwordHash?: string; securityPin?: string }> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (!raw) {
      const initial: Record<string, UserProfile & { passwordHash?: string; securityPin?: string }> = {
        [DEFAULT_ADMIN.id]: {
          ...DEFAULT_ADMIN,
          passwordHash: ADMIN_PASSWORD,
          securityPin: ADMIN_SECURITY_CODE,
        },
      };
      localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Ensure default admin always has correct password and pin
    parsed[DEFAULT_ADMIN.id] = {
      ...DEFAULT_ADMIN,
      passwordHash: ADMIN_PASSWORD,
      securityPin: ADMIN_SECURITY_CODE,
    };
    return parsed;
  } catch {
    return {
      [DEFAULT_ADMIN.id]: {
        ...DEFAULT_ADMIN,
        passwordHash: ADMIN_PASSWORD,
        securityPin: ADMIN_SECURITY_CODE,
      },
    };
  }
};

export const saveUsers = (users: Record<string, UserProfile & { passwordHash?: string; securityPin?: string }>) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users', err);
  }
};

export const getCurrentUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: UserProfile | null) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      const users = getStoredUsers();
      users[user.id] = { ...users[user.id], ...user };
      saveUsers(users);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (err) {
    console.error('Failed to set current user', err);
  }
};

export const createNewUser = (
  username: string,
  email: string,
  avatarId: string,
  password?: string
): UserProfile => {
  const id = 'user_' + Math.random().toString(36).substring(2, 10);
  const newUser: UserProfile = {
    id,
    username: username.trim() || 'Player_' + Math.floor(1000 + Math.random() * 9000),
    email: email.trim().toLowerCase() || `${username.toLowerCase().replace(/\s+/g, '')}@player.com`,
    avatarId: avatarId || PREDEFINED_AVATARS[0].id,
    bio: 'Cricket & Casino Player at Small Casino 🎰',
    balance: WELCOME_BONUS_USD,
    registeredAt: new Date().toISOString(),
    bonusClaimed: true,
    isAdmin: false,
    stats: {
      wins: 0,
      losses: 0,
      totalBets: 0,
      totalWagered: 0,
      totalWon: 0,
      biggestWin: 0,
      netProfit: 0,
      favoriteGame: 'Live Cricket',
    },
  };

  const users = getStoredUsers();
  users[id] = { ...newUser, passwordHash: password || 'player123' };
  saveUsers(users);
  setCurrentUser(newUser);

  // Add welcome bonus
  const bonusTx: Transaction = {
    id: 'tx_bonus_' + Date.now(),
    userId: newUser.id,
    username: newUser.username,
    type: 'BONUS',
    currency: 'INR_UPI',
    amount: WELCOME_BONUS_USD,
    address: 'Internal Treasury',
    txHash: 'bonus_' + Math.random().toString(36).substring(2, 15),
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    statusLogs: [
      {
        timestamp: new Date().toISOString(),
        message: `Welcome bonus of $${WELCOME_BONUS_USD.toFixed(2)} granted on new account creation.`,
        state: 'CREDITED',
      },
    ],
  };
  addTransaction(bonusTx);

  addPushNotification({
    id: 'notif_welcome_' + Date.now(),
    title: '🎁 Welcome Bonus Claimed!',
    message: `$${WELCOME_BONUS_USD.toFixed(2)} USD (₹${(WELCOME_BONUS_USD * 86.5).toFixed(0)} INR) bonus credited to your wallet balance!`,
    amount: WELCOME_BONUS_USD,
    type: 'BONUS',
    timestamp: new Date().toISOString(),
    read: false,
  });

  return newUser;
};

export const getTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRANSACTIONS;
  }
};

export const saveTransactions = (txs: Transaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (err) {
    console.error('Failed to save txs', err);
  }
};

export const addTransaction = (tx: Transaction) => {
  const current = getTransactions();
  const updated = [tx, ...current];
  saveTransactions(updated);
  return updated;
};

export const updateTransaction = (txId: string, updates: Partial<Transaction>) => {
  const current = getTransactions();
  const updated = current.map((t) => (t.id === txId ? { ...t, ...updates } : t));
  saveTransactions(updated);
  return updated;
};

export const getActivities = (): BetActivity[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addActivity = (act: BetActivity) => {
  try {
    const current = getActivities();
    const updated = [act, ...current].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const getNotifications = (): PushNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const requestBrowserNotificationPermission = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }
  return 'denied';
};

export const addPushNotification = (notif: PushNotification) => {
  try {
    const current = getNotifications();
    const updated = [notif, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('small_casino_notification', { detail: notif }));

      // Real browser system notification if supported & permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notif.title, {
            body: notif.message,
            icon: '/icon.svg',
          });
        } catch {
          // ignore notification api restrictions
        }
      }
    }

    // Urgent alerts play distinctive synthesizer alarm
    if (notif.actionRequired) {
      sounds.playAlert();
    } else {
      sounds.playCoinDing();
    }

    return updated;
  } catch {
    return [];
  }
};

export const markNotificationsAsRead = () => {
  try {
    const current = getNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

// Admin Send Crypto / Funds to Any Player by User ID or Username
export const adminSendCryptoToUser = (
  targetUserId: string,
  amountUsd: number,
  currency: string = 'USDT_TRON',
  memo: string = 'Treasury Direct Transfer'
): { success: boolean; user?: UserProfile; error?: string } => {
  try {
    const users = getStoredUsers();
    let target = users[targetUserId];

    if (!target) {
      // Find by username case-insensitively
      const found = Object.values(users).find(
        (u) => u.username.toLowerCase() === targetUserId.toLowerCase()
      );
      if (found) target = found;
    }

    if (!target) {
      return { success: false, error: `Player "${targetUserId}" not found.` };
    }

    if (isNaN(amountUsd) || amountUsd <= 0) {
      return { success: false, error: 'Amount must be greater than $0.00' };
    }

    const newBalance = Number((target.balance + amountUsd).toFixed(2));
    target.balance = newBalance;
    users[target.id] = target;
    saveUsers(users);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === target.id) {
      currentUser.balance = newBalance;
      setCurrentUser(currentUser);
    }

    // Generate authentic transaction hash
    const txHash =
      currency === 'INR_UPI'
        ? `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}/TRANSFER`
        : `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newTx: Transaction = {
      id: `tx_adm_send_${Date.now()}`,
      userId: target.id,
      username: target.username,
      type: 'DEPOSIT',
      currency: (currency as any) || 'USDT_TRON',
      amount: amountUsd,
      address: `Admin Treasury -> @${target.username}`,
      txHash,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      statusLogs: [
        {
          timestamp: new Date().toISOString(),
          message: `Admin transferred $${amountUsd.toFixed(2)} USD (${currency}) to @${target.username}. Memo: "${memo}"`,
          state: 'ADMIN_SENT',
        },
        {
          timestamp: new Date().toISOString(),
          message: `Instant treasury transfer completed. TXID: ${txHash.substring(0, 16)}... Credited to player wallet.`,
          state: 'CONFIRMED',
        },
      ],
    };
    addTransaction(newTx);

    // 1. Real notification to the player
    addPushNotification({
      id: `notif_adm_send_${Date.now()}`,
      title: '💎 Crypto Received from Treasury!',
      message: `Admin sent +$${amountUsd.toFixed(2)} USD (₹${(amountUsd * 86.5).toFixed(0)} INR) in ${currency.replace('_', ' ')} to your wallet! Memo: ${memo}`,
      amount: amountUsd,
      type: 'ADMIN_CRYPTO_TRANSFER',
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: 'user',
      targetUserId: target.id,
    });

    // 2. Real notification to Admin log
    addPushNotification({
      id: `notif_adm_log_${Date.now()}`,
      title: '✅ Crypto Transfer Sent Successfully',
      message: `Sent $${amountUsd.toFixed(2)} USD to @${target.username} (${target.id}). New player balance: $${newBalance.toFixed(2)}.`,
      amount: amountUsd,
      type: 'BALANCE_CREDIT',
      timestamp: new Date().toISOString(),
      read: false,
      targetRole: 'admin',
    });

    return { success: true, user: target };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Transfer failed' };
  }
};

// Tournaments data
export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tourn_cricket_ipl',
    title: 'Indian Cricket Premier League Sprint',
    game: 'Live Cricket Sports',
    bannerGradient: 'from-blue-600 via-indigo-600 to-amber-600',
    prizePoolUsd: 1500.0,
    participants: 280,
    userRank: 9,
    userScore: 920,
    endsInSeconds: 3600 * 5,
    minBet: 0.2,
    active: true,
  },
  {
    id: 'tourn_5050_duel',
    title: 'High-Roller Sprint',
    game: 'Coin Flip & Dice',
    bannerGradient: 'from-amber-500 via-rose-500 to-red-600',
    prizePoolUsd: 500.0,
    participants: 184,
    userRank: 12,
    userScore: 840,
    endsInSeconds: 3600 * 8,
    minBet: 0.1,
    active: true,
  },
  {
    id: 'tourn_slots_championship',
    title: 'Royal Slots Multiplier Cup',
    game: 'Royal Slots 777',
    bannerGradient: 'from-purple-600 via-indigo-600 to-blue-700',
    prizePoolUsd: 1250.0,
    participants: 342,
    userRank: 45,
    userScore: 320,
    endsInSeconds: 3600 * 22,
    minBet: 0.05,
    active: true,
  },
];

// Seeded Leaderboards
export const SEED_LEADERBOARDS: LeaderboardPlayer[] = [
  {
    rank: 1,
    username: 'SatoshiStriker',
    avatarEmoji: '👑',
    avatarGradient: 'from-amber-500 to-yellow-600',
    totalWagered: 14250.8,
    netProfit: 8420.5,
    winRate: 64.2,
    biggestWin: 3200.0,
  },
  {
    rank: 2,
    username: 'MumbaiIndiansFan',
    avatarEmoji: '🏏',
    avatarGradient: 'from-blue-600 to-cyan-500',
    totalWagered: 11200.0,
    netProfit: 6840.0,
    winRate: 61.5,
    biggestWin: 2400.0,
  },
  {
    rank: 3,
    username: 'NeonViper',
    avatarEmoji: '⚡',
    avatarGradient: 'from-cyan-500 to-blue-600',
    totalWagered: 9840.0,
    netProfit: 5120.3,
    winRate: 59.8,
    biggestWin: 1800.0,
  },
  {
    rank: 4,
    username: 'DiamondHands_TRX',
    avatarEmoji: '💎',
    avatarGradient: 'from-emerald-500 to-teal-700',
    totalWagered: 8710.25,
    netProfit: 4690.0,
    winRate: 58.1,
    biggestWin: 2100.0,
  },
];

// Live Indian Cricket Matches Data
export const INITIAL_CRICKET_MATCHES: CricketMatch[] = [
  {
    id: 'cricket_ind_aus',
    tournament: 'India vs Australia • 3rd ODI Series Live',
    teamA: 'India',
    teamB: 'Australia',
    teamAFlag: '🇮🇳',
    teamBFlag: '🇦🇺',
    status: 'LIVE',
    scoreA: '242/4 (38.2 ov)',
    scoreB: '238/9 (40 ov)',
    summary: 'India need 32 runs in 40 balls with 6 wickets remaining',
    venue: 'Wankhede Stadium, Mumbai, India',
    markets: [
      {
        id: 'mkt_winner_1',
        title: 'Match Winner',
        optionA: 'India to Win',
        oddsA: 1.45,
        optionB: 'Australia to Win',
        oddsB: 2.75,
        type: 'MATCH_WINNER',
      },
      {
        id: 'mkt_over_1',
        title: 'Runs in Next Over (Over 39)',
        optionA: 'Over 7.5 Runs',
        oddsA: 1.85,
        optionB: 'Under 7.5 Runs',
        oddsB: 1.85,
        type: 'OVER_RUNS',
      },
      {
        id: 'mkt_boundary_1',
        title: 'Boundary (4 or 6) in Next 6 Balls',
        optionA: 'Yes (Boundary Hit)',
        oddsA: 2.25,
        optionB: 'No Boundary',
        oddsB: 1.55,
        type: 'BOUNDARY_NEXT_OVER',
      },
    ],
  },
  {
    id: 'cricket_csk_mi',
    tournament: 'Indian Premier League (IPL) • Live Match 24',
    teamA: 'Chennai Super Kings',
    teamB: 'Mumbai Indians',
    teamAFlag: '🦁',
    teamBFlag: '⚡',
    status: 'LIVE',
    scoreA: '182/4 (17.3 ov)',
    scoreB: '179/7 (20 ov)',
    summary: 'CSK need 14 runs in 15 balls • MS Dhoni at crease',
    venue: 'M. A. Chidambaram Stadium, Chepauk, Chennai',
    markets: [
      {
        id: 'mkt_csk_win',
        title: 'Match Winner (IPL)',
        optionA: 'Chennai Super Kings',
        oddsA: 1.38,
        optionB: 'Mumbai Indians',
        oddsB: 3.05,
        type: 'MATCH_WINNER',
      },
      {
        id: 'mkt_csk_runs',
        title: 'Next Over Total Runs',
        optionA: 'Over 9.5 Runs',
        oddsA: 1.95,
        optionB: 'Under 9.5 Runs',
        oddsB: 1.78,
        type: 'OVER_RUNS',
      },
      {
        id: 'mkt_csk_wkt',
        title: 'Wicket to fall in next 6 balls?',
        optionA: 'Yes (Wicket)',
        oddsA: 2.65,
        optionB: 'No Wicket',
        oddsB: 1.42,
        type: 'NEXT_WICKET',
      },
    ],
  },
  {
    id: 'cricket_rcb_kkr',
    tournament: 'Indian Premier League (IPL) • Upcoming Night Match',
    teamA: 'Royal Challengers Bengaluru',
    teamB: 'Kolkata Knight Riders',
    teamAFlag: '🔴',
    teamBFlag: '🟣',
    status: 'UPCOMING',
    scoreA: 'Starts at 7:30 PM IST',
    scoreB: 'Toss in 45 mins',
    summary: 'Chinnaswamy pitch report: High-scoring batting paradise',
    venue: 'M. Chinnaswamy Stadium, Bengaluru, India',
    markets: [
      {
        id: 'mkt_rcb_win',
        title: 'Match Winner',
        optionA: 'RCB',
        oddsA: 1.82,
        optionB: 'KKR',
        oddsB: 1.95,
        type: 'MATCH_WINNER',
      },
      {
        id: 'mkt_rcb_sixes',
        title: 'Total Match Sixes',
        optionA: 'Over 16.5 Sixes',
        oddsA: 1.85,
        optionB: 'Under 16.5 Sixes',
        oddsB: 1.85,
        type: 'OVER_RUNS',
      },
    ],
  },
];

export const getCricketMatches = (): CricketMatch[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRICKET_MATCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CRICKET_MATCHES, JSON.stringify(INITIAL_CRICKET_MATCHES));
      return INITIAL_CRICKET_MATCHES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CRICKET_MATCHES;
  }
};
