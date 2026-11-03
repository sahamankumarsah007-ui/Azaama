import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  RefreshCw,
  Coins,
  X,
  FileText,
  UserCheck,
  LogOut,
  Send,
  DollarSign,
  Bell,
  Wallet,
} from 'lucide-react';
import { Transaction, UserProfile, USD_TO_INR } from '../types';
import {
  getTransactions,
  updateTransaction,
  getStoredUsers,
  saveUsers,
  addPushNotification,
  adminSendCryptoToUser,
  requestBrowserNotificationPermission,
} from '../utils/storage';
import { sounds } from '../utils/audio';

interface AdminPanelProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSignOut,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'DEPOSITS' | 'USERS' | 'SEND_CRYPTO'>('WITHDRAWALS');
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  const [usersMap, setUsersMap] = useState<Record<string, UserProfile>>(getStoredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectReason, setRejectReason] = useState<string>('Destination wallet security check flag');
  const [selectedTxForReject, setSelectedTxForReject] = useState<Transaction | null>(null);

  // Send Crypto to any user
  const [sendTargetInput, setSendTargetInput] = useState<string>('');
  const [sendAmountUsd, setSendAmountUsd] = useState<string>('25.00');
  const [sendCurrency, setSendCurrency] = useState<string>('USDT_TRON');
  const [sendMemo, setSendMemo] = useState<string>('Treasury Player Credit');
  const [sendResultMsg, setSendResultMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSendingCrypto, setIsSendingCrypto] = useState<boolean>(false);

  // User balance adjustment
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [adjustAmountUsd, setAdjustAmountUsd] = useState<string>('10.0');
  const [adjustMsg, setAdjustMsg] = useState<string | null>(null);
  const [browserNotificationStatus, setBrowserNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const refreshList = () => {
    setTransactions(getTransactions());
    setUsersMap(getStoredUsers());
    if (onRefreshData) onRefreshData();
  };

  const handleApprove = (tx: Transaction) => {
    const generatedHash =
      tx.currency === 'INR_UPI'
        ? 'UPI/' + Math.floor(100000000000 + Math.random() * 900000000000) + '/APPROVED'
        : '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newLogs = [
      ...tx.statusLogs,
      {
        timestamp: new Date().toISOString(),
        message: `Admin manually approved withdrawal of $${tx.amount.toFixed(2)} USD (₹${(tx.amount * USD_TO_INR).toFixed(0)} INR). Reference: ${generatedHash.substring(0, 16)}...`,
        state: 'APPROVED_BROADCASTED',
      },
    ];

    updateTransaction(tx.id, {
      status: 'CONFIRMED',
      processedAt: new Date().toISOString(),
      txHash: generatedHash,
      statusLogs: newLogs,
    });

    // Notify user
    addPushNotification({
      id: 'notif_adm_appr_' + Date.now(),
      title: '✅ Withdrawal Approved & Sent!',
      message: `Your withdrawal of $${tx.amount.toFixed(2)} USD (₹${(tx.amount * USD_TO_INR).toFixed(0)} INR) has been approved and broadcasted. Ref: ${generatedHash.substring(0, 14)}...`,
      amount: tx.amount,
      type: 'WITHDRAW_APPROVED',
      timestamp: new Date().toISOString(),
      read: false,
    });

    sounds.playJackpot();
    refreshList();
  };

  const handleConfirmReject = () => {
    if (!selectedTxForReject) return;
    const tx = selectedTxForReject;

    // Refund funds back to user
    const users = getStoredUsers();
    const targetUser = users[tx.userId];
    if (targetUser) {
      targetUser.balance = Number((targetUser.balance + tx.amount).toFixed(2));
      saveUsers(users);
    }

    const newLogs = [
      ...tx.statusLogs,
      {
        timestamp: new Date().toISOString(),
        message: `Admin REJECTED withdrawal. Reason: "${rejectReason}". $${tx.amount.toFixed(2)} USD refunded to player balance.`,
        state: 'REJECTED_REFUNDED',
      },
    ];

    updateTransaction(tx.id, {
      status: 'REJECTED',
      adminNotes: rejectReason,
      processedAt: new Date().toISOString(),
      statusLogs: newLogs,
    });

    // Notify user
    addPushNotification({
      id: 'notif_adm_rej_' + Date.now(),
      title: '❌ Withdrawal Request Rejected',
      message: `Withdrawal of $${tx.amount.toFixed(2)} USD (₹${(tx.amount * USD_TO_INR).toFixed(0)} INR) was rejected: ${rejectReason}. Full funds refunded to your wallet.`,
      amount: tx.amount,
      type: 'WITHDRAW_REJECTED',
      timestamp: new Date().toISOString(),
      read: false,
    });

    sounds.playCoinDing();
    setSelectedTxForReject(null);
    refreshList();
  };

  const handleAdjustBalance = (isCredit: boolean) => {
    if (!selectedUserId) {
      alert('Please select a player.');
      return;
    }
    const delta = parseFloat(adjustAmountUsd);
    if (isNaN(delta) || delta <= 0) return;

    const users = getStoredUsers();
    const target = users[selectedUserId];
    if (!target) return;

    const newBal = isCredit
      ? Number((target.balance + delta).toFixed(2))
      : Math.max(0, Number((target.balance - delta).toFixed(2)));

    target.balance = newBal;
    saveUsers(users);

    addPushNotification({
      id: 'notif_adj_' + Date.now(),
      title: isCredit ? '🎁 Admin Credit' : '⚠️ Admin Balance Adjustment',
      message: `Your wallet was ${isCredit ? 'credited' : 'debited'} by $${delta.toFixed(2)} USD (₹${(delta * USD_TO_INR).toFixed(0)} INR).`,
      amount: isCredit ? delta : -delta,
      type: isCredit ? 'BALANCE_CREDIT' : 'BALANCE_DEBIT',
      timestamp: new Date().toISOString(),
      read: false,
    });

    sounds.playCoinDing();
    setAdjustMsg(`Updated @${target.username}'s wallet to $${newBal.toFixed(2)} USD (₹${(newBal * USD_TO_INR).toFixed(0)} INR).`);
    refreshList();
    setTimeout(() => setAdjustMsg(null), 3000);
  };

  const handleEnableBrowserNotifications = async () => {
    const res = await requestBrowserNotificationPermission();
    setBrowserNotificationStatus(res);
    if (res === 'granted') {
      sounds.playCoinDing();
      alert('Desktop Push Notifications enabled! You will receive real-time alerts whenever a user requests a withdrawal.');
    } else {
      alert('Browser notifications were not granted. In-app urgent banners and synthesized alerts are active.');
    }
  };

  const handleSendCryptoToPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setSendResultMsg(null);

    const amt = parseFloat(sendAmountUsd);
    if (isNaN(amt) || amt <= 0) {
      setSendResultMsg({ text: 'Please enter a valid amount greater than $0.00', isError: true });
      return;
    }

    if (!sendTargetInput.trim()) {
      setSendResultMsg({ text: 'Please enter a target Username or Player ID', isError: true });
      return;
    }

    setIsSendingCrypto(true);
    setTimeout(() => {
      const res = adminSendCryptoToUser(
        sendTargetInput.trim(),
        amt,
        sendCurrency,
        sendMemo.trim() || 'Admin Direct Treasury Transfer'
      );

      setIsSendingCrypto(false);
      if (res.success && res.user) {
        sounds.playJackpot();
        setSendResultMsg({
          text: `Success! Transferred $${amt.toFixed(2)} USD (₹${(amt * USD_TO_INR).toFixed(0)} INR) to @${res.user.username} (${res.user.id}). New Player Balance: $${res.user.balance.toFixed(2)} USD.`,
          isError: false,
        });
        refreshList();
      } else {
        setSendResultMsg({
          text: res.error || 'Failed to transfer crypto. Verify user identifier.',
          isError: true,
        });
      }
    }, 400);
  };

  const pendingWithdrawals = transactions.filter(
    (t) => t.type === 'WITHDRAWAL' && t.status === 'PENDING_APPROVAL'
  );

  const allDeposits = transactions.filter((t) => t.type === 'DEPOSIT');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Sign Out Admin Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Small Casino Master Admin Portal</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TREASURY & VALIDATOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manual withdrawal reviews (3 to 5 hours queue), UPI & crypto validation, user control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={refreshList}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  sounds.playChip();
                  onSignOut();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-900/30"
                title="Sign Out Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Admin</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Action Required Notification Bar for Admin */}
        {pendingWithdrawals.length > 0 && (
          <div className="bg-rose-950/80 border-b border-rose-500/40 px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-rose-300 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>
                ⚠️ ACTION REQUIRED: {pendingWithdrawals.length} Real Withdrawal Request{pendingWithdrawals.length > 1 ? 's' : ''} Awaiting Admin Approval! (3 to 5 Hours Window)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnableBrowserNotifications}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Bell className="w-3 h-3 text-amber-400" />
                <span>
                  {browserNotificationStatus === 'granted'
                    ? 'Push Notifications Active'
                    : 'Enable Push Notifications'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar with Send Crypto */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto no-scrollbar gap-2">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('WITHDRAWALS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'WITHDRAWALS'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Withdrawals ({pendingWithdrawals.length})</span>
              {pendingWithdrawals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('SEND_CRYPTO')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'SEND_CRYPTO'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                  : 'bg-emerald-950/40 text-emerald-300 hover:text-white border border-emerald-500/30'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>💸 Send Crypto ($) to User</span>
            </button>

            <button
              onClick={() => setActiveTab('DEPOSITS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'DEPOSITS'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deposits Log ({allDeposits.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'USERS'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>User Balance Controls</span>
            </button>
          </div>

          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tx or player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
          {activeTab === 'WITHDRAWALS' && (
            <div>
              {pendingWithdrawals.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/50" />
                  <span>No pending withdrawal requests in 3 to 5 hours queue! All cleared.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingWithdrawals.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">Player: @{tx.username}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              3 to 5 Hours Queue
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            Requested: {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black font-mono text-amber-400">
                            ${tx.amount.toFixed(2)} USD
                          </div>
                          <div className="text-xs font-mono text-emerald-400 font-bold">
                            ₹{(tx.amount * USD_TO_INR).toFixed(0)} INR ({tx.currency.replace('_', ' ')})
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1 font-mono">
                        <div className="text-slate-400">
                          Destination Address / UPI ID:{' '}
                          <span className="text-amber-300 break-all select-all font-bold">{tx.address}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">TX Reference: {tx.id}</div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
                        <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Status Logs (3 to 5 Hours Processing):</span>
                        </div>
                        {tx.statusLogs.map((log, i) => (
                          <div key={i} className="text-slate-400 flex items-start gap-2">
                            <span className="text-amber-400/80 font-mono">
                              [{new Date(log.timestamp).toLocaleTimeString()}]
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTxForReject(tx)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject & Refund</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(tx)}
                          className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Complete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'SEND_CRYPTO' && (
            <div className="space-y-5">
              <form onSubmit={handleSendCryptoToPlayer} className="p-5 sm:p-6 rounded-3xl bg-slate-950/90 border border-emerald-500/30 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Treasury Crypto &amp; Funds Direct Transfer</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send any amount of Crypto ($ USD / USDT / BTC / INR) to any player by User ID or Username.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    INSTANT WALLET CREDIT
                  </span>
                </div>

                {sendResultMsg && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                      sendResultMsg.isError
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {sendResultMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Player Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Target Player (Select Account or Type ID):
                    </label>
                    <select
                      value={sendTargetInput}
                      onChange={(e) => setSendTargetInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white mb-2"
                    >
                      <option value="">-- Choose from Registered Players --</option>
                      {Object.values(usersMap)
                        .filter((u) => !u.isAdmin)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            @{u.username} • Balance: ${u.balance.toFixed(2)} USD (₹{(u.balance * USD_TO_INR).toFixed(0)}) • ID: {u.id}
                          </option>
                        ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Or enter custom Username or User ID..."
                      value={sendTargetInput}
                      onChange={(e) => setSendTargetInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Currency / Asset Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Crypto / Currency Asset:
                    </label>
                    <select
                      value={sendCurrency}
                      onChange={(e) => setSendCurrency(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="USDT_TRON">USDT (TRON - TRC20)</option>
                      <option value="USDT_ETH">USDT (Ethereum - ERC20)</option>
                      <option value="BTC">Bitcoin (BTC Native)</option>
                      <option value="INR_UPI">Indian Rupees (INR / UPI)</option>
                    </select>

                    <div className="mt-2 text-[11px] text-slate-400">
                      Destination network will generate a verified transaction hash and instant balance credit.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount Input */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Amount ($ USD):</span>
                      <span className="text-amber-300 font-mono font-bold text-xs">
                        ≈ ₹{((parseFloat(sendAmountUsd) || 0) * USD_TO_INR).toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR
                      </span>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={sendAmountUsd}
                        onChange={(e) => setSendAmountUsd(e.target.value)}
                        placeholder="Enter amount (e.g. 25.00)"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Quick amount chips */}
                    <div className="flex gap-1.5 mt-2">
                      {['5', '20', '50', '100', '500'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSendAmountUsd(amt + '.00')}
                          className="flex-1 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-emerald-400 font-bold border border-slate-800 cursor-pointer"
                        >
                          +${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transfer Memo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Transfer Memo / Purpose:
                    </label>
                    <input
                      type="text"
                      value={sendMemo}
                      onChange={(e) => setSendMemo(e.target.value)}
                      placeholder="e.g. Tournament Prize, VIP Bonus, Direct Deposit"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <div className="text-[10px] text-slate-500 mt-1.5">
                      This note will be shown on the player's activity history and push notification.
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSendingCrypto || !sendTargetInput.trim()}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSendingCrypto ? (
                      <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Transfer &amp; Send Crypto to Player</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'DEPOSITS' && (
            <div className="space-y-3">
              {allDeposits.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        @{tx.username} • {tx.currency.replace('_', ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                        Ref / Hash: {tx.txHash}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      +${tx.amount.toFixed(2)} USD
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono">
                      ₹{(tx.amount * USD_TO_INR).toFixed(0)} INR
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
                  Adjust Player Wallet Balance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Select Player:</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    >
                      <option value="">-- Choose Account --</option>
                      {Object.values(usersMap).map((u) => (
                        <option key={u.id} value={u.id}>
                          @{u.username} (Current: ${u.balance.toFixed(2)} / ₹{(u.balance * USD_TO_INR).toFixed(0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Adjustment Amount ($ USD):</label>
                    <input
                      type="number"
                      step="1"
                      value={adjustAmountUsd}
                      onChange={(e) => setAdjustAmountUsd(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {adjustMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    {adjustMsg}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleAdjustBalance(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer"
                  >
                    Debit (-${adjustAmountUsd})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBalance(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    Credit (+${adjustAmountUsd})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal for Rejection Reason */}
        {selectedTxForReject && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-5 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-rose-400 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span>Reject Withdrawal of ${selectedTxForReject.amount.toFixed(2)} USD</span>
                </h3>
                <button
                  onClick={() => setSelectedTxForReject(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Rejecting this request will immediately refund <strong>${selectedTxForReject.amount.toFixed(2)} USD</strong> back to player @{selectedTxForReject.username}'s wallet balance.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Rejection Reason:
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mb-2"
                >
                  <option value="Destination UPI ID / wallet check flag">Destination UPI ID / wallet check flag</option>
                  <option value="Bank network downtime during 3-5h window">Bank network downtime during 3-5h window</option>
                  <option value="Incorrect IFSC or VPA address">Incorrect IFSC or VPA address</option>
                </select>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  placeholder="Custom rejection note..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTxForReject(null)}
                  className="px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  Confirm Rejection & Refund Funds
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
