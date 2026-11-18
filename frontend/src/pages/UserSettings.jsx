import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Bell, Lock, Save } from 'lucide-react';

export default function UserSettings() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [prefForm, setPrefForm] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    reminderDays: '15,7,3,1,0',
  });

  const [loadingPref, setLoadingPref] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [savingPref, setSavingPref] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await api.get('/notifications/preferences');
        if (res.success && res.data) {
          setPrefForm(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPref(false);
      }
    }
    loadPreferences();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (res.success) {
        updateUser(res.user);
        addToast('Profile updated successfully.', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      addToast('New passwords do not match.', 'warning');
      return;
    }
    setSavingPass(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      if (res.success) {
        addToast('Password changed successfully.', 'success');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      addToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    setSavingPref(true);
    try {
      const res = await api.put('/notifications/preferences', prefForm);
      if (res.success) {
        addToast('Notification preferences saved.', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update preferences.', 'error');
    } finally {
      setSavingPref(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Account & Notification Settings</h1>
        <p className="text-sm text-zinc-500">
          Manage your personal details, Sri Lankan mobile notification preferences, and password
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Personal Information</h2>
              <p className="text-xs text-zinc-400">Update your name & contact</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Email is tied to your identity.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Sri Lankan Mobile (+94)
              </label>
              <input
                type="text"
                required
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
            >
              <Save className="w-4 h-4 text-zinc-950" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Security & Password</h2>
              <p className="text-xs text-zinc-400">Update your login credentials</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPass}
              className="w-full mt-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow-md shadow-zinc-900/10 disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>{savingPass ? 'Updating...' : 'Change Password'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-zinc-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900">Automated Reminder Preferences</h2>
            <p className="text-xs text-zinc-400">Configure reminder channels and notification schedules</p>
          </div>
        </div>

        <form onSubmit={handlePrefSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-zinc-900">Email Notifications</p>
                <p className="text-xs text-zinc-500">Receive formatted reminder emails</p>
              </div>
              <input
                type="checkbox"
                checked={prefForm.emailEnabled}
                onChange={(e) => setPrefForm({ ...prefForm, emailEnabled: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-zinc-900">In-App Alerts</p>
                <p className="text-xs text-zinc-500">Push to Notification Center</p>
              </div>
              <input
                type="checkbox"
                checked={prefForm.inAppEnabled}
                onChange={(e) => setPrefForm({ ...prefForm, inAppEnabled: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-zinc-900">SMS Gateway</p>
                <p className="text-xs text-zinc-500">Direct mobile text message</p>
              </div>
              <input
                type="checkbox"
                checked={prefForm.smsEnabled}
                onChange={(e) => setPrefForm({ ...prefForm, smsEnabled: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-zinc-900">WhatsApp Alerts</p>
                <p className="text-xs text-zinc-500">WhatsApp Business notifications</p>
              </div>
              <input
                type="checkbox"
                checked={prefForm.whatsappEnabled}
                onChange={(e) => setPrefForm({ ...prefForm, whatsappEnabled: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Milestone Reminder Days (Comma-separated before expiry)
            </label>
            <input
              type="text"
              value={prefForm.reminderDays}
              onChange={(e) => setPrefForm({ ...prefForm, reminderDays: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <p className="text-xs text-zinc-400 mt-1.5">
              Default schedule: <strong>15, 7, 3, 1, 0</strong> days prior to document expiry (Asia/Colombo timezone).
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPref}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4 text-zinc-950" />
              <span>{savingPref ? 'Saving...' : 'Update Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
