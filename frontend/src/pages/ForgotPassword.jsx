import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const resetTokenParam = searchParams.get('token');
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [debugToken, setDebugToken] = useState(null);

  const isResetMode = Boolean(resetTokenParam);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.debugToken) {
          setDebugToken(res.debugToken);
        }
      }
    } catch (err) {
      addToast(err.message || 'Request failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match.', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token: resetTokenParam,
        newPassword,
      });
      if (res.success) {
        addToast(res.message, 'success');
        setSuccessMessage('Password updated successfully. You can now log in.');
      }
    } catch (err) {
      addToast(err.message || 'Reset failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 shadow-2xl shadow-zinc-950/10 p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            {isResetMode ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {isResetMode
              ? 'Enter your new secure password below'
              : 'Enter your registered email to receive recovery instructions'}
          </p>
        </div>

        {successMessage ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-emerald-800 leading-relaxed">{successMessage}</p>
            {debugToken && (
              <div className="p-2 bg-white rounded-lg border border-emerald-300 text-[11px] text-zinc-600">
                <span className="font-bold">Development Reset Link:</span>
                <Link
                  to={`/forgot-password?token=${debugToken}`}
                  className="block text-amber-700 font-bold underline mt-1"
                >
                  Click Here to Set New Password
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
            >
              Return to Login
            </Link>
          </div>
        ) : isResetMode ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Resetting Password...' : 'Save New Password'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <span>{submitting ? 'Sending Link...' : 'Send Password Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-center text-xs text-zinc-500">
          Remember your password?{' '}
          <Link to="/login" className="font-bold text-amber-600 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
