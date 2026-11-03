import React, { useState } from 'react';
import {
  X,
  User,
  Trophy,
  Flame,
  TrendingUp,
  Percent,
  Coins,
  Edit3,
  Check,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserProfile, PREDEFINED_AVATARS } from '../types';
import { setCurrentUser, getStoredUsers, saveUsers } from '../utils/storage';
import { sounds } from '../utils/audio';

interface ProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarId);
  const [soundOn, setSoundOn] = useState(sounds.isEnabled());
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAvatar =
    PREDEFINED_AVATARS.find((a) => a.id === user.avatarId) || PREDEFINED_AVATARS[0];

  const winRate =
    user.stats.totalBets > 0
      ? ((user.stats.wins / user.stats.totalBets) * 100).toFixed(1)
      : '0.0';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const updated: UserProfile = {
      ...user,
      username: username.trim(),
      bio: bio.trim(),
      avatarId: selectedAvatar,
    };

    setCurrentUser(updated);

    // Also update in all users map
    const allUsers = getStoredUsers();
    if (allUsers[user.id]) {
      allUsers[user.id] = { ...allUsers[user.id], ...updated };
      saveUsers(allUsers);
    }

    onUserUpdated(updated);
    sounds.playWin();
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sounds.setEnabled(next);
    if (next) sounds.playCoinDing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className={`h-24 bg-gradient-to-r ${currentAvatar.bgGradient} relative p-4 flex justify-between items-start`}>
          <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase text-amber-300">
            {currentAvatar.tag} VIP Member
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-12 mb-4 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div
                className={`w-24 h-24 rounded-2xl flex items-center justify-center text-5xl bg-gradient-to-tr ${currentAvatar.bgGradient} border-4 border-slate-900 shadow-xl`}
              >
                {currentAvatar.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-2xl font-black text-white">{user.username}</h2>
                  {user.isAdmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{user.bio || 'Small Casino High Roller'}</p>
                <div className="text-[11px] text-slate-500 font-mono mt-1">
                  Member since {new Date(user.registeredAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title={soundOn ? 'Mute Sounds' : 'Unmute Sounds'}
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {/* EDIT FORM */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 mb-6">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Edit Player Information & Avatar
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Username:
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bio / Player Tagline:
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 50:50 Coin Master, Blackjack Ace"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select New Avatar:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PREDEFINED_AVATARS.map((av) => {
                    const isSel = selectedAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          isSel
                            ? 'border-amber-400 bg-amber-500/20 scale-105'
                            : 'border-slate-800 bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-tr ${av.bgGradient}`}>
                          {av.emoji}
                        </div>
                        <span className="text-[10px] text-slate-300 truncate w-full text-center">
                          {av.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : null}

          {/* GAME STATISTICS GRID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Player Game Statistics</span>
              </h3>
              <span className="text-[11px] text-slate-500">Real-time synced</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400">Total Bets Placed</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {user.stats.totalBets}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400">Win Rate</div>
                <div className="text-lg font-black text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                  <span>{winRate}%</span>
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400">Wins / Losses</div>
                <div className="text-sm font-bold font-mono mt-1">
                  <span className="text-emerald-400">{user.stats.wins} W</span>
                  <span className="text-slate-500"> / </span>
                  <span className="text-rose-400">{user.stats.losses} L</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400">Biggest Win</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                  ${user.stats.biggestWin.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Total Wagered</div>
                  <div className="text-base font-black text-slate-200 font-mono mt-0.5">
                    ${user.stats.totalWagered.toFixed(2)} USD
                  </div>
                </div>
                <Coins className="w-6 h-6 text-yellow-500/60" />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Favorite Game</div>
                  <div className="text-base font-bold text-amber-300 mt-0.5">
                    {user.stats.favoriteGame || 'Royal Slots'}
                  </div>
                </div>
                <Flame className="w-6 h-6 text-rose-500/60" />
              </div>
            </div>
          </div>

          {/* Logout button */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Signed in as {user.email || user.username}</span>
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
