import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Bell,
  FileCheck2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Navigation */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-zinc-900">
                VehicleGuard <span className="text-amber-600">LK</span>
              </span>
              <p className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">Sri Lanka</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-bold text-zinc-700 hover:text-amber-600 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-zinc-50 border-b border-zinc-200/80 py-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Built Specifically for Sri Lankan Vehicle Owners</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-zinc-900 tracking-tight leading-[1.1]">
            Never let your Sri Lankan vehicle documents <span className="text-amber-600">expire unnoticed.</span>
          </h1>

          <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Automated compliance reminders for <strong>Revenue License, Insurance, Emission Test, and Route Permits</strong>.
            Receive alerts 15 days, 7 days, 3 days, and 1 day before expiration via email and in-app notifications.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-2xl text-base font-bold shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Protect Your Vehicles</span>
              <ArrowRight className="w-5 h-5 text-zinc-950" />
            </Link>
            <a
              href="https://eservices.motortraffic.gov.lk/"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-700 rounded-2xl text-base font-semibold border border-zinc-200 transition-all flex items-center justify-center space-x-2"
            >
              <span>Sri Lanka e-Revenue Portal</span>
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </a>
          </div>

          {/* Micro stats banner */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-zinc-200 text-left">
            <div>
              <p className="text-2xl font-black text-zinc-900">15 Days</p>
              <p className="text-xs text-zinc-500 mt-0.5">Advance Expiry Warning</p>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900">9 Provinces</p>
              <p className="text-xs text-zinc-500 mt-0.5">Sri Lanka-Wide Registry</p>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900">Asia/Colombo</p>
              <p className="text-xs text-zinc-500 mt-0.5">Accurate Local Timezone</p>
            </div>
            <div>
              <p className="text-2xl font-black text-zinc-900">100% Free</p>
              <p className="text-xs text-zinc-500 mt-0.5">For Private Owners</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
            Comprehensive Document Management Tailored for Sri Lanka
          </h2>
          <p className="text-zinc-500 text-sm mt-2">
            Eliminate spot fines, expired revenue penalties, and delayed insurance claims with smart tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Automated 15-Day Cadence</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Background schedulers trigger reminders at 15d, 7d, 3d, 1d milestones, and on expiry day. Built-in deduplication prevents spamming.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Preserved Renewal History</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Extend document expiration dates with one click. VehicleGuard preserves complete past renewal receipts, reference numbers, and costs.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200/80 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">Multi-Channel Delivery</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Receive standard HTML reminder emails and in-app alerts, with full readiness for Sri Lankan mobile SMS and WhatsApp notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-zinc-950 text-zinc-400 py-12 px-4 sm:px-8 border-t border-zinc-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <span className="text-sm font-bold text-white">VehicleGuard LK</span>
            <span className="text-zinc-500">| Sri Lanka Document Expiry System</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Create Account</Link>
            <a href="https://eservices.motortraffic.gov.lk/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              Official e-Revenue Portal (gov.lk)
            </a>
          </div>

          <p className="text-zinc-500">&copy; {new Date().getFullYear()} VehicleGuard LK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
