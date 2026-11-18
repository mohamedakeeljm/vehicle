import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success) {
        login(res.token, res.user);
        addToast(`Welcome back, ${res.user.fullName}!`, 'success');
        navigate(res.user.role === 'ADMIN' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-100">
      <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200/80 shadow-2xl shadow-zinc-950/10 p-8 space-y-6">
        {/* Header & Logo */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            VehicleGuard <span className="text-amber-600">LK</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Sri Lanka Vehicle Document Expiry Reminder System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Email Address
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-semibold text-amber-600 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-sm font-bold shadow-md shadow-amber-500/25 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In to VehicleGuard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs text-zinc-700 space-y-2">
          <p className="font-bold text-amber-950 text-[11px] uppercase tracking-wider">Quick Demo Credentials:</p>
          <div className="flex justify-between items-center text-[11px]">
            <span><strong>Owner:</strong> kasun.perera@example.lk</span>
            <button
              onClick={() => {
                setEmail('kasun.perera@example.lk');
                setPassword('Password@123');
              }}
              className="text-amber-700 font-bold hover:underline"
            >
              Fill
            </button>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span><strong>Admin:</strong> admin@vehicleguard.lk</span>
            <button
              onClick={() => {
                setEmail('admin@vehicleguard.lk');
                setPassword('Admin@12345');
              }}
              className="text-amber-700 font-bold hover:underline"
            >
              Fill
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-amber-600 hover:underline">
            Register your vehicle here
          </Link>
        </p>
      </div>
    </div>
  );
}
