import React, { useState } from 'react';
import { User, Mail, Calendar, Lock, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import avatarImg from '../assets/images/avatar_student_scholar_1790940938132.jpg';

export default function ProfilePage() {
  const { user, setUser, logout, showToast } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      showToast('Please enter a valid name (at least 2 characters).', 'error');
      return;
    }

    setIsUpdatingName(true);
    try {
      const res = await api.updateProfile(name.trim());
      setUser(res.user);
      showToast('Your student profile name has been updated.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not update name.', 'error');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.updatePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast('Password changed successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-mono text-sky-400">Account Settings</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          Student Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Manage your personal details, security credentials, and active session.
        </p>
      </div>

      {/* Account Overview Card (Required: Name, Email, Account creation date) */}
      <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={avatarImg}
            alt={user?.name || 'Student'}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border border-indigo-400/40"
          />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white font-display">
              {user?.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                {user?.email}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Joined{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : '2026'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Update Name Form */}
      <form
        onSubmit={handleUpdateName}
        className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4"
      >
        <h3 className="text-base font-bold text-white font-display">
          Update Profile Name
        </h3>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdatingName}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isUpdatingName ? 'Saving...' : 'Save Name'}</span>
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4"
      >
        <h3 className="text-base font-bold text-white font-display">
          Change Password
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Current Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-xs font-semibold cursor-pointer"
          >
            {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
