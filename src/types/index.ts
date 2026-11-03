export type CryptoCurrency = 'USDT_TRON' | 'USDT_ETH' | 'BTC' | 'INR_UPI';

export interface CryptoDepositAddress {
  currency: CryptoCurrency;
  network: string;
  name: string;
  symbol: string;
  address: string;
  minDepositUsd: number;
  qrSampleUrl?: string;
  icon: string;
  confirmationsNeeded: number;
}

export const USD_TO_INR = 86.5; // Current exchange rate: 1 USD ≈ 86.5 INR

export const CRYPTO_CONFIG: Record<CryptoCurrency, CryptoDepositAddress> = {
  INR_UPI: {
    currency: 'INR_UPI',
    network: 'Indian UPI (GPay / PhonePe / Paytm / BHIM)',
    name: 'Indian Rupees (INR / UPI)',
    symbol: 'INR (₹)',
    address: 'amankumarsah@fam',
    minDepositUsd: 0.01,
    icon: '₹',
    confirmationsNeeded: 1,
  },
  USDT_TRON: {
    currency: 'USDT_TRON',
    network: 'TRON (TRC-20)',
    name: 'Tether USD (TRC20)',
    symbol: 'USDT-TRC20',
    address: 'TKufhgEpgZqSnZtP6nvjawrKW8YV9oGX68',
    minDepositUsd: 0.01,
    icon: '💎',
    confirmationsNeeded: 1,
  },
  USDT_ETH: {
    currency: 'USDT_ETH',
    network: 'Ethereum (ERC-20)',
    name: 'Tether USD (ERC20)',
    symbol: 'USDT-ERC20',
    address: '0xfca5CF7c688BEa9243C973267834344331135C07',
    minDepositUsd: 0.01,
    icon: '⚡',
    confirmationsNeeded: 2,
  },
  BTC: {
    currency: 'BTC',
    network: 'Bitcoin Native (SegWit)',
    name: 'Bitcoin',
    symbol: 'BTC',
    address: 'bc1qp7h7d2sgdxckrn80sknluw7z6nveqah7jq0scc',
    minDepositUsd: 0.01,
    icon: '₿',
    confirmationsNeeded: 1,
  },
};

export const MIN_DEPOSIT_USD = 0.01;
export const MIN_WITHDRAWAL_USD = 3.0; // ₹260 INR equivalent
export const WELCOME_BONUS_USD = 0.1;

export interface AvatarOption {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  tag: string;
}

export const PREDEFINED_AVATARS: AvatarOption[] = [
  { id: 'high_roller', name: 'High Roller', emoji: '👑', bgGradient: 'from-amber-500 to-yellow-600', tag: 'VIP' },
  { id: 'cyber_spinner', name: 'Cyber Spinner', emoji: '🤖', bgGradient: 'from-cyan-500 to-blue-600', tag: 'TECH' },
  { id: 'queen_spades', name: 'Queen of Spades', emoji: '♠️', bgGradient: 'from-purple-600 to-pink-600', tag: 'PRO' },
  { id: 'diamond_hands', name: 'Diamond Ace', emoji: '💎', bgGradient: 'from-emerald-500 to-teal-700', tag: 'WHALE' },
  { id: 'golden_bull', name: 'Golden Bull', emoji: '🐂', bgGradient: 'from-amber-600 to-red-600', tag: 'BULL' },
  { id: 'lucky_cat', name: 'Lucky Neko', emoji: '🐱', bgGradient: 'from-rose-500 to-orange-500', tag: 'LUCK' },
  { id: 'crypto_whale', name: 'Crypto Whale', emoji: '🐋', bgGradient: 'from-indigo-600 to-sky-500', tag: 'ELITE' },
  { id: 'neon_joker', name: 'Neon Joker', emoji: '🃏', bgGradient: 'from-fuchsia-600 to-purple-800', tag: 'WILD' },
];

export interface UserStats {
  wins: number;
  losses: number;
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  netProfit: number;
  favoriteGame: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarId: string;
  bio?: string;
  balance: number; // stored in USD
  registeredAt: string;
  bonusClaimed: boolean;
  isAdmin?: boolean;
  stats: UserStats;
}

export interface StatusLogEntry {
  timestamp: string;
  message: string;
  state: string;
}

export interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BONUS' | 'TOURNAMENT_PRIZE';
  currency: CryptoCurrency;
  amount: number; // in USD
  cryptoAmount?: string;
  address: string;
  txHash: string;
  status: 'PENDING_APPROVAL' | 'CONFIRMED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
  statusLogs: StatusLogEntry[];
}

export interface BetActivity {
  id: string;
  userId: string;
  username: string;
  gameId: string;
  gameName: string;
  betAmount: number;
  payout: number;
  profit: number;
  multiplier: number;
  outcome: 'WIN' | 'LOSS' | 'PUSH';
  timestamp: string;
  details?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  amount?: number;
  type:
    | 'BALANCE_CREDIT'
    | 'BALANCE_DEBIT'
    | 'DEPOSIT_SUCCESS'
    | 'WITHDRAW_PENDING'
    | 'WITHDRAW_APPROVED'
    | 'WITHDRAW_REJECTED'
    | 'ADMIN_ACTION_REQUIRED'
    | 'ADMIN_CRYPTO_TRANSFER'
    | 'WIN'
    | 'BONUS';
  timestamp: string;
  read: boolean;
  targetRole?: 'admin' | 'user' | 'all';
  targetUserId?: string;
  actionRequired?: boolean;
  txId?: string;
}

export interface Tournament {
  id: string;
  title: string;
  game: string;
  bannerGradient: string;
  prizePoolUsd: number;
  participants: number;
  userRank: number;
  userScore: number;
  endsInSeconds: number;
  minBet: number;
  active: boolean;
}

export interface LeaderboardPlayer {
  rank: number;
  username: string;
  avatarEmoji: string;
  avatarGradient: string;
  totalWagered: number;
  netProfit: number;
  winRate: number;
  biggestWin: number;
  isCurrentUser?: boolean;
}

// Live Cricket Sports Betting Types
export interface CricketBetMarket {
  id: string;
  title: string;
  oddsA: number;
  oddsB: number;
  optionA: string;
  optionB: string;
  type: 'MATCH_WINNER' | 'OVER_RUNS' | 'NEXT_WICKET' | 'BOUNDARY_NEXT_OVER';
}

export interface CricketMatch {
  id: string;
  tournament: string; // e.g. "India Tour of Australia" or "IPL 2026 Live"
  teamA: string; // e.g. "India"
  teamB: string; // e.g. "Australia"
  teamAFlag: string;
  teamBFlag: string;
  status: 'LIVE' | 'UPCOMING' | 'INNINGS_BREAK';
  scoreA: string; // e.g. "194/3 (18.4 ov)"
  scoreB: string; // e.g. "192/7 (20 ov)"
  summary: string; // e.g. "India need 8 runs in 8 balls"
  venue: string; // e.g. "Wankhede Stadium, Mumbai"
  markets: CricketBetMarket[];
}
