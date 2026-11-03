import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, ArrowDownLeft, ArrowUpRight, Gift, Trophy, X } from 'lucide-react';
import { PushNotification } from '../types';
import { getNotifications, markNotificationsAsRead } from '../utils/storage';
import { sounds } from '../utils/audio';

interface NotificationCenterProps {
  onOpenWallet?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenWallet }) => {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toastQueue, setToastQueue] = useState<PushNotification[]>([]);

  useEffect(() => {
    setNotifications(getNotifications());

    const handleCustomNotif = (e: Event) => {
      const customEvent = e as CustomEvent<PushNotification>;
      const notif = customEvent.detail;
      setNotifications((prev) => [notif, ...prev]);

      // Trigger synthesized sound
      sounds.playNotification();

      // Enqueue toast
      setToastQueue((prev) => [...prev, notif]);
      setTimeout(() => {
        setToastQueue((prev) => prev.filter((item) => item.id !== notif.id));
      }, 5000);
    };

    window.addEventListener('small_casino_notification', handleCustomNotif);
    return () => {
      window.removeEventListener('small_casino_notification', handleCustomNotif);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setIsOpen(!isOpen);
  };

  const getIcon = (type: PushNotification['type']) => {
    switch (type) {
      case 'BALANCE_CREDIT':
      case 'DEPOSIT_SUCCESS':
      case 'ADMIN_CRYPTO_TRANSFER':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'ADMIN_ACTION_REQUIRED':
        return <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'WITHDRAW_PENDING':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'WITHDRAW_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WITHDRAW_REJECTED':
      case 'BALANCE_DEBIT':
        return <ArrowUpRight className="w-4 h-4 text-rose-400" />;
      case 'BONUS':
        return <Gift className="w-4 h-4 text-yellow-400" />;
      case 'WIN':
        return <Trophy className="w-4 h-4 text-amber-300" />;
      default:
        return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <>
      {/* Real-time Floating Toasts in Top-Right */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toastQueue.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-slate-900/95 shadow-2xl backdrop-blur-md text-white animate-in slide-in-from-right-8 fade-in duration-300"
          >
            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-amber-300 truncate">{toast.title}</span>
                <span className="text-[10px] text-slate-400 shrink-0">Now</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toast.message}</p>
              {toast.amount !== undefined && (
                <div className="mt-1 text-xs font-bold font-mono text-emerald-400">
                  {toast.amount >= 0 ? `+$${toast.amount.toFixed(2)}` : `-$${Math.abs(toast.amount).toFixed(2)}`}
                </div>
              )}
            </div>
            <button
              onClick={() => setToastQueue((prev) => prev.filter((i) => i.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Bell Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={handleToggle}
          className="relative p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Notifications & Balance Updates"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 text-white backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Push Alerts & Balance History</h3>
              </div>
              <span className="text-xs text-slate-400">{notifications.length} total</span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 my-2 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No balance updates or notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-3 flex items-start gap-3 hover:bg-slate-800/40 p-2 rounded-lg transition-colors">
                    <div className="p-2 rounded-lg bg-slate-800 shrink-0 mt-0.5 border border-slate-700/60">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 break-words">{n.message}</p>
                      {n.amount !== undefined && (
                        <span className="inline-block mt-1 font-mono text-xs font-bold text-emerald-400">
                          {n.amount >= 0 ? `+$${n.amount.toFixed(2)}` : `-$${Math.abs(n.amount).toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {onOpenWallet && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenWallet();
                }}
                className="w-full mt-2 py-2 text-center text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors cursor-pointer"
              >
                View Full Wallet & Transactions →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};
