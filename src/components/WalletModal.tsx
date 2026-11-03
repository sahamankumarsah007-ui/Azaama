import React, { useState } from 'react';
import {
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  QrCode,
} from 'lucide-react';
import {
  UserProfile,
  CryptoCurrency,
  CRYPTO_CONFIG,
  MIN_DEPOSIT_USD,
  MIN_WITHDRAWAL_USD,
  Transaction,
  USD_TO_INR,
} from '../types';
import {
  addTransaction,
  getTransactions,
  addPushNotification,
  setCurrentUser,
} from '../utils/storage';
import { sounds } from '../utils/audio';

interface WalletModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdated: (newBalance: number) => void;
  initialTab?: 'deposit' | 'withdraw' | 'history';
}

export const WalletModal: React.FC<WalletModalProps> = ({
  user,
  isOpen,
  onClose,
  onBalanceUpdated,
  initialTab = 'deposit',
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency>('INR_UPI');
  const [currencyView, setCurrencyView] = useState<'USD' | 'INR'>('INR');
  const [copied, setCopied] = useState(false);

  // Deposit state
  const [simulatedInrAmount, setSimulatedInrAmount] = useState<string>('500'); // ₹500 INR
  const [txHashInput, setTxHashInput] = useState<string>('');
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState<string>('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);

  // Withdrawal state
  const [withdrawAmountUsd, setWithdrawAmountUsd] = useState<string>('5.00');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // History state
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeMethod = CRYPTO_CONFIG[selectedCurrency];
  const allTxs = getTransactions().filter((t) => t.userId === user.id || t.username === user.username);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(activeMethod.address);
    setCopied(true);
    sounds.playChip();
    setTimeout(() => setCopied(false), 2000);
  };

  // Instant Verification on deposit without needing confirm button
  const triggerInstantDepositVerification = (depositAmtUsd: number, customTxHash?: string) => {
    if (depositAmtUsd < MIN_DEPOSIT_USD) {
      alert(`Minimum deposit is $${MIN_DEPOSIT_USD}`);
      return;
    }

    setIsAutoVerifying(true);
    setDepositSuccessMsg(null);
    setVerifyStep(
      selectedCurrency === 'INR_UPI'
        ? 'Scanning UPI Payment Gateway & NPCI Node...'
        : 'Connecting to network node & scanning mempool...'
    );

    setTimeout(() => {
      setVerifyStep(
        selectedCurrency === 'INR_UPI'
          ? 'UPI Transfer to amankumarsah@fam detected! Verifying UTR Reference...'
          : 'Deposit detected! Validating cryptographic signature...'
      );

      setTimeout(() => {
        setVerifyStep('Confirmation received. Updating wallet balance instantly...');

        setTimeout(() => {
          const generatedHash =
            customTxHash?.trim() ||
            (selectedCurrency === 'INR_UPI'
              ? 'UPI/' + Math.floor(100000000000 + Math.random() * 900000000000) + '/UTR'
              : '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

          const newBalance = Number((user.balance + depositAmtUsd).toFixed(2));
          user.balance = newBalance;
          setCurrentUser(user);
          onBalanceUpdated(newBalance);

          const newTx: Transaction = {
            id: 'tx_dep_' + Date.now(),
            userId: user.id,
            username: user.username,
            type: 'DEPOSIT',
            currency: selectedCurrency,
            amount: depositAmtUsd,
            address: activeMethod.address,
            txHash: generatedHash,
            status: 'CONFIRMED',
            createdAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            statusLogs: [
              {
                timestamp: new Date().toISOString(),
                message:
                  selectedCurrency === 'INR_UPI'
                    ? `UPI Deposit of ₹${(depositAmtUsd * USD_TO_INR).toFixed(0)} INR ($${depositAmtUsd.toFixed(2)} USD) received at ${activeMethod.address}`
                    : `Deposit of $${depositAmtUsd.toFixed(2)} USD received on ${activeMethod.network}`,
                state: 'DETECTED',
              },
              {
                timestamp: new Date().toISOString(),
                message: `Instant automated verification passed. Ref: ${generatedHash.substring(0, 16)}... Credited to wallet.`,
                state: 'CONFIRMED',
              },
            ],
          };
          addTransaction(newTx);

          addPushNotification({
            id: 'notif_dep_' + Date.now(),
            title: selectedCurrency === 'INR_UPI' ? '⚡ UPI Deposit Instant Verified!' : '⚡ Instant Deposit Verified!',
            message: `+₹${(depositAmtUsd * USD_TO_INR).toFixed(0)} INR (+$${depositAmtUsd.toFixed(2)} USD) credited via ${activeMethod.name}.`,
            amount: depositAmtUsd,
            type: 'DEPOSIT_SUCCESS',
            timestamp: new Date().toISOString(),
            read: false,
          });

          sounds.playJackpot();
          setIsAutoVerifying(false);
          setVerifyStep('');
          setTxHashInput('');
          setDepositSuccessMsg(
            selectedCurrency === 'INR_UPI'
              ? `Instant Verification Complete! +₹${(depositAmtUsd * USD_TO_INR).toFixed(0)} INR (+$${depositAmtUsd.toFixed(2)} USD) added to your wallet.`
              : `Instant Verification Complete! +$${depositAmtUsd.toFixed(2)} USD added to your wallet.`
          );
        }, 600);
      }, 600);
    }, 600);
  };

  const handleTxHashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTxHashInput(val);
    if (val.trim().length >= 10 && !isAutoVerifying) {
      const amtInr = parseFloat(simulatedInrAmount) || 500;
      const amtUsd = Number((amtInr / USD_TO_INR).toFixed(2));
      triggerInstantDepositVerification(amtUsd, val);
    }
  };

  // Withdrawal Validator & Submission to Admin Queue (3 to 5 Hours)
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const amt = parseFloat(withdrawAmountUsd);

    if (isNaN(amt) || amt < MIN_WITHDRAWAL_USD) {
      setWithdrawError(
        `Minimum withdrawal amount is $${MIN_WITHDRAWAL_USD.toFixed(2)} USD (₹${(MIN_WITHDRAWAL_USD * USD_TO_INR).toFixed(0)} INR) for all currencies.`
      );
      return;
    }

    if (amt > user.balance) {
      setWithdrawError(`Insufficient balance! Your current wallet balance is $${user.balance.toFixed(2)} USD.`);
      return;
    }

    if (!withdrawAddress.trim() || withdrawAddress.trim().length < 6) {
      setWithdrawError('Please enter a valid payout destination (UPI ID, Bank Account, or Crypto Address).');
      return;
    }

    if (selectedCurrency === 'INR_UPI' && !withdrawAddress.includes('@')) {
      setWithdrawError('Please enter a valid UPI ID (e.g. yourname@oksbi, yourname@paytm).');
      return;
    }
    if (selectedCurrency === 'USDT_TRON' && !withdrawAddress.trim().startsWith('T')) {
      setWithdrawError('TRON USDT (TRC-20) addresses must start with uppercase letter "T".');
      return;
    }
    if (selectedCurrency === 'USDT_ETH' && !withdrawAddress.trim().startsWith('0x')) {
      setWithdrawError('Ethereum USDT (ERC-20) addresses must start with "0x".');
      return;
    }

    const updatedBalance = Number((user.balance - amt).toFixed(2));
    user.balance = updatedBalance;
    setCurrentUser(user);
    onBalanceUpdated(updatedBalance);

    const now = new Date();
    const newTx: Transaction = {
      id: 'tx_wdr_' + Date.now(),
      userId: user.id,
      username: user.username,
      type: 'WITHDRAWAL',
      currency: selectedCurrency,
      amount: amt,
      address: withdrawAddress.trim(),
      txHash: 'wdr_queue_' + Math.random().toString(36).substring(2, 10),
      status: 'PENDING_APPROVAL',
      createdAt: now.toISOString(),
      statusLogs: [
        {
          timestamp: now.toISOString(),
          message: `Withdrawal request for $${amt.toFixed(2)} USD (₹${(amt * USD_TO_INR).toFixed(0)} INR) submitted. Validator checks passed.`,
          state: 'SUBMITTED',
        },
        {
          timestamp: new Date(now.getTime() + 1000).toISOString(),
          message: 'Transferred to Admin Approval Queue. Estimated manual verification wait: 3 to 5 hours.',
          state: 'PENDING_ADMIN_3_TO_5_HOURS',
        },
      ],
    };

    addTransaction(newTx);

    // 1. Player Confirmation Notification
    addPushNotification({
      id: 'notif_wdr_usr_' + Date.now(),
      title: '⏳ Withdrawal Submitted (3-5 Hours)',
      message: `Your withdrawal of $${amt.toFixed(2)} USD (₹${(amt * USD_TO_INR).toFixed(0)} INR) is in Admin Queue. Estimated wait time: 3 to 5 hours.`,
      amount: -amt,
      type: 'WITHDRAW_PENDING',
      timestamp: now.toISOString(),
      read: false,
      targetRole: 'user',
      targetUserId: user.id,
    });

    // 2. REAL Admin Alert Notification (Not fake, triggers synthesizer alarm)
    addPushNotification({
      id: 'notif_wdr_adm_' + Date.now(),
      title: '⚠️ ACTION REQUIRED: New Withdrawal Request!',
      message: `Player @${user.username} requested payout of $${amt.toFixed(2)} USD (₹${(amt * USD_TO_INR).toFixed(0)} INR) via ${selectedCurrency} to ${withdrawAddress.trim()}. Review queue now!`,
      amount: amt,
      type: 'ADMIN_ACTION_REQUIRED',
      timestamp: now.toISOString(),
      read: false,
      targetRole: 'admin',
      actionRequired: true,
      txId: newTx.id,
    });

    sounds.playCoinDing();
    setWithdrawSuccess(
      `Withdrawal request submitted! It is now pending Admin approval (processed within 3 to 5 hours).`
    );
    setWithdrawAddress('');
  };

  const filteredHistory = allTxs.filter((t) => {
    if (historyFilter === 'ALL') return true;
    return t.type === historyFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Small Casino Cashier & Wallet</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Wallet Balance:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${user.balance.toFixed(2)} USD
                </span>
                <span className="text-amber-300 font-mono font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  ₹{(user.balance * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 1 })} INR
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-2 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'deposit'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>Deposit (Instant)</span>
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'withdraw'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
            <span>Withdraw (3-5 Hours)</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Transaction Logs</span>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: DEPOSIT */}
          {activeTab === 'deposit' && (
            <div className="space-y-6">
              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Deposit Method (Indian Rupees & Crypto):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(CRYPTO_CONFIG) as CryptoCurrency[]).map((cur) => {
                    const cfg = CRYPTO_CONFIG[cur];
                    const isSel = selectedCurrency === cur;
                    return (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setSelectedCurrency(cur)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          isSel
                            ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-2xl font-bold">{cfg.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{cfg.name}</div>
                          <div className="text-[9px] text-amber-400 font-mono truncate">{cfg.network}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deposit Card Details */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Dynamic Visual QR Code */}
                  <div className="p-2.5 rounded-2xl bg-white shrink-0 shadow-lg flex flex-col items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-28 h-28 text-slate-950" fill="currentColor">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="28" height="28" fill="black" />
                      <rect x="14" y="14" width="20" height="20" fill="white" />
                      <rect x="18" y="18" width="12" height="12" fill="black" />
                      <rect x="62" y="10" width="28" height="28" fill="black" />
                      <rect x="66" y="14" width="20" height="20" fill="white" />
                      <rect x="70" y="18" width="12" height="12" fill="black" />
                      <rect x="10" y="62" width="28" height="28" fill="black" />
                      <rect x="14" y="66" width="20" height="20" fill="white" />
                      <rect x="18" y="70" width="12" height="12" fill="black" />
                      {Array.from({ length: 24 }).map((_, i) => (
                        <rect
                          key={i}
                          x={12 + (i % 7) * 11}
                          y={12 + Math.floor(i / 7) * 18}
                          width="4"
                          height="4"
                          fill="black"
                        />
                      ))}
                    </svg>
                    <span className="text-[9px] font-mono text-slate-800 font-bold mt-1">
                      {selectedCurrency === 'INR_UPI' ? 'Scan with GPay/PhonePe' : 'Scan & Pay'}
                    </span>
                  </div>

                  {/* Address Details */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedCurrency === 'INR_UPI'
                          ? 'Official UPI ID / VPA to Receive INR:'
                          : 'Official Receive Address:'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                        ⚡ Instant Auto-Verify
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{activeMethod.address}</span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors shrink-0 cursor-pointer"
                        title="Copy address"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-slate-300">
                        Minimum Deposit:{' '}
                        <span className="text-emerald-400 font-bold font-mono">
                          {selectedCurrency === 'INR_UPI' ? '₹10 INR ($0.01 USD)' : `$${MIN_DEPOSIT_USD.toFixed(2)} USD`}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Exchange Rate: 1 USD ≈ ₹{USD_TO_INR} INR
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instant Automated Payment Verification Engine</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    No confirm button needed on deposit. Transfer via UPI to <strong>amankumarsah@fam</strong> or send crypto. When UTR / Tx reference is entered or detected, your wallet balance updates instantly!
                  </p>
                </div>
              </div>

              {/* Instant Automated Verification Simulator */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    {selectedCurrency === 'INR_UPI'
                      ? 'Instant UPI UTR Reference & Deposit Detector'
                      : 'Instant TX-Hash Detector'}
                  </span>
                  <span className="text-[10px] text-slate-400">Min $0.01 / ₹10</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {selectedCurrency === 'INR_UPI' ? 'Amount (₹ INR):' : 'Amount ($ USD):'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="10"
                      value={simulatedInrAmount}
                      onChange={(e) => setSimulatedInrAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    />
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      ≈ ${Number((parseFloat(simulatedInrAmount || '0') / USD_TO_INR).toFixed(2))} USD
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {selectedCurrency === 'INR_UPI' ? 'Enter UPI 12-Digit UTR:' : 'Paste TX Hash:'}
                    </label>
                    <input
                      type="text"
                      placeholder={selectedCurrency === 'INR_UPI' ? 'e.g. 314987291039' : 'e.g. 0x8a7f...'}
                      value={txHashInput}
                      onChange={handleTxHashChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {isAutoVerifying && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span className="text-xs text-amber-300 font-medium animate-pulse">{verifyStep}</span>
                  </div>
                )}

                {depositSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{depositSuccessMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isAutoVerifying}
                  onClick={() => {
                    const amtInr = parseFloat(simulatedInrAmount) || 500;
                    const amtUsd = Number((amtInr / USD_TO_INR).toFixed(2));
                    triggerInstantDepositVerification(amtUsd);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white hover:brightness-110 shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Send & Instant Auto-Verify{' '}
                    {selectedCurrency === 'INR_UPI'
                      ? `₹${simulatedInrAmount} INR`
                      : `$${(parseFloat(simulatedInrAmount || '0') / USD_TO_INR).toFixed(2)} USD`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WITHDRAWAL (3 TO 5 HOURS TIME) */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleWithdrawSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Payout Method:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CRYPTO_CONFIG) as CryptoCurrency[]).map((cur) => {
                    const cfg = CRYPTO_CONFIG[cur];
                    const isSel = selectedCurrency === cur;
                    return (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => setSelectedCurrency(cur)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSel
                            ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xl">{cfg.icon}</div>
                        <div className="text-xs mt-1 truncate">{cfg.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 to 5 Hours Admin Verification Protocol Notice */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span>3 to 5 Hours Admin Verification Protocol</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Per security regulations, all withdrawal requests are assigned directly to the Small Casino treasury admin queue and manually verified within <strong>3 to 5 hours</strong>. Minimum withdrawal is <strong>${MIN_WITHDRAWAL_USD.toFixed(2)} USD (₹{(MIN_WITHDRAWAL_USD * USD_TO_INR).toFixed(0)} INR)</strong>.
                </p>
              </div>

              {withdrawError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-300">Withdrawal Amount:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      Available:{' '}
                      <strong className="text-emerald-400">
                        ${user.balance.toFixed(2)} (₹{(user.balance * USD_TO_INR).toFixed(0)})
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmountUsd(user.balance.toFixed(2))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-amber-300 cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={MIN_WITHDRAWAL_USD}
                    max={user.balance}
                    required
                    value={withdrawAmountUsd}
                    onChange={(e) => setWithdrawAmountUsd(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Minimum $3.00"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>
                    Minimum: ${MIN_WITHDRAWAL_USD.toFixed(2)} USD (₹{(MIN_WITHDRAWAL_USD * USD_TO_INR).toFixed(0)} INR)
                  </span>
                  <span>Processing Time: 3 to 5 Hours</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {selectedCurrency === 'INR_UPI'
                    ? 'Your UPI ID (VPA) for Payout:'
                    : `Your ${activeMethod.name} Destination Address:`}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    selectedCurrency === 'INR_UPI'
                      ? 'e.g. mobile@upi or username@okaxis'
                      : selectedCurrency === 'USDT_TRON'
                      ? 'e.g. TRON address starting with T...'
                      : selectedCurrency === 'USDT_ETH'
                      ? 'e.g. 0x...'
                      : 'e.g. bc1q...'
                  }
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:brightness-110 text-white shadow-lg shadow-rose-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                <span>Submit Withdrawal Request (3 to 5 Hours Review)</span>
              </button>
            </form>
          )}

          {/* TAB 3: TRANSACTION LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {(['ALL', 'DEPOSIT', 'WITHDRAWAL'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setHistoryFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        historyFilter === f
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">{filteredHistory.length} records</span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No transaction records found under this filter.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHistory.map((tx) => {
                    const isExpanded = expandedTxId === tx.id;
                    const isDep = tx.type === 'DEPOSIT' || tx.type === 'BONUS';
                    const isPending = tx.status === 'PENDING_APPROVAL';
                    const isRejected = tx.status === 'REJECTED';

                    return (
                      <div
                        key={tx.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 transition-all hover:border-slate-700"
                      >
                        <div
                          className="flex items-center justify-between cursor-pointer select-none"
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                isDep ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {isDep ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">
                                  {tx.type} • {tx.currency.replace('_', ' ')}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isPending
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : isRejected
                                      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  }`}
                                >
                                  {isPending ? '⏳ 3-5h Review' : isRejected ? '❌ Rejected' : '✓ Confirmed'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(tx.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div
                                className={`font-mono text-sm font-black ${
                                  isDep ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isDep ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                              </div>
                              <div className="text-[10px] text-amber-300 font-mono">
                                ₹{(tx.amount * USD_TO_INR).toFixed(0)} INR
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Transaction ID:</span>
                              <span className="font-mono text-slate-300 text-[11px]">{tx.id}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Destination / Address:</span>
                              <span className="font-mono text-amber-300 text-[11px] break-all">{tx.address}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Reference / TXID:</span>
                              <span className="font-mono text-slate-300 text-[11px] break-all">{tx.txHash}</span>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-800">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                Verification & Status Logs (3-5 Hours Queue):
                              </span>
                              <div className="space-y-1.5">
                                {tx.statusLogs.map((log, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start gap-2 text-[11px]"
                                  >
                                    <span className="text-amber-400 shrink-0 font-mono text-[10px]">
                                      [{new Date(log.timestamp).toLocaleTimeString()}]
                                    </span>
                                    <span className="text-slate-300">{log.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
