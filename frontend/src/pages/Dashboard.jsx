import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  FileCheck2,
  AlertTriangle,
  XCircle,
  PlusCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Shield,
  Calendar,
  CheckCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const { metrics, chartData, upcomingExpiring, recentNotifications, recentRenewals } = data || {
    metrics: { totalVehicles: 0, totalActive: 0, expiringWithin15: 0, expired: 0, valid: 0 },
    chartData: [],
    upcomingExpiring: [],
    recentNotifications: [],
    recentRenewals: [],
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* Mobile Greeting & Quick Status Card */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-900 p-5 sm:p-7 rounded-3xl text-white shadow-xl shadow-zinc-950/20 border border-zinc-800/90 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sri Lanka (Asia/Colombo)</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
              Daily check: 7:00 AM
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            Ayubowan, {user?.fullName?.split(' ')[0] || 'Driver'}! 👋
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm mt-1 max-w-lg leading-relaxed">
            {metrics.expired > 0 ? (
              <span className="text-rose-400 font-bold">
                ⚠️ You have {metrics.expired} overdue expired document{metrics.expired > 1 ? 's' : ''}!
              </span>
            ) : metrics.expiringWithin15 > 0 ? (
              <span className="text-amber-300 font-semibold">
                🔔 {metrics.expiringWithin15} document{metrics.expiringWithin15 > 1 ? 's' : ''} expiring within 15 days.
              </span>
            ) : (
              <span>All registered vehicle documents are valid and road-compliant.</span>
            )}
          </p>

          {/* Quick Action Touch Buttons */}
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            <Link
              to="/vehicles/new"
              className="flex items-center justify-center space-x-2 py-3 px-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all text-center"
            >
              <PlusCircle className="w-4 h-4 text-zinc-950 flex-shrink-0" />
              <span className="truncate">Add Vehicle</span>
            </Link>
            <a
              href="https://eservices.motortraffic.gov.lk/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center space-x-2 py-3 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded-2xl text-xs sm:text-sm border border-zinc-700 active:scale-95 transition-all text-center"
            >
              <ExternalLink className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="truncate">Gov e-License</span>
            </a>
          </div>
        </div>
      </div>

      {/* Horizontal Swipeable Mobile KPI Metric Chips */}
      <div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5 px-1">
          Compliance Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Vehicles Card */}
          <Link
            to="/vehicles"
            className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between active:scale-98 transition-all hover:border-amber-300"
          >
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase">Vehicles</p>
              <p className="text-xl sm:text-2xl font-black text-zinc-900 mt-0.5">{metrics.totalVehicles}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </Link>

          {/* Valid Documents */}
          <Link
            to="/documents?status=VALID"
            className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between active:scale-98 transition-all hover:border-emerald-300"
          >
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase">Fully Valid</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">{metrics.valid}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </Link>

          {/* Expiring Soon (<15d) */}
          <Link
            to="/documents?status=EXPIRING"
            className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between active:scale-98 transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-amber-800 uppercase">Due &le; 15 Days</p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{metrics.expiringWithin15}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </Link>

          {/* Expired / Overdue */}
          <Link
            to="/documents?status=EXPIRED"
            className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between active:scale-98 transition-all"
          >
            <div>
              <p className="text-[11px] font-bold text-rose-800 uppercase">Overdue</p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">{metrics.expired}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Priority Expiry Alerts - Mobile-Friendly Feed */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900">Priority Expiries</h2>
            <p className="text-xs text-zinc-400">Needs your immediate renewal</p>
          </div>
          <Link
            to="/documents"
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingExpiring.length === 0 ? (
          <div className="py-8 text-center text-zinc-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-sm text-zinc-700">All documents are up-to-date!</p>
            <p className="text-xs text-zinc-400 mt-0.5">No expiries due in the next 30 days.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingExpiring.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-zinc-200 hover:border-amber-300 bg-zinc-50/60 flex items-center justify-between gap-3 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-lg">
                      {item.vehicleNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.statusMeta.badgeClass}`}>
                      {item.statusMeta.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 truncate mt-1">
                    {item.documentName}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Expiry: {new Date(item.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <Link
                  to={`/vehicles/${item.vehicleId}?renew=${item.id}`}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex-shrink-0"
                >
                  Renew
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance Ring & Recent Reminders Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Document Status Breakdown Chart */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Compliance Health</h2>
              <p className="text-xs text-zinc-400">Total {metrics.totalDocuments} tracked certificates</p>
            </div>
            <Link to="/calendar" className="text-xs font-bold text-amber-700 hover:underline">
              Calendar &rarr;
            </Link>
          </div>

          <div className="h-48 my-3 flex items-center justify-center">
            {metrics.totalDocuments === 0 ? (
              <div className="text-center text-zinc-400 text-xs">No documents registered yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex justify-around text-center border-t border-zinc-100 pt-3 text-xs">
            <div>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span>
              <span className="font-bold text-zinc-800">{metrics.valid}</span>
              <span className="text-[10px] text-zinc-400 block">Valid</span>
            </div>
            <div>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span>
              <span className="font-bold text-zinc-800">{metrics.expiringWithin15}</span>
              <span className="text-[10px] text-zinc-400 block">Due &le; 15d</span>
            </div>
            <div>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5"></span>
              <span className="font-bold text-zinc-800">{metrics.expired}</span>
              <span className="text-[10px] text-zinc-400 block">Expired</span>
            </div>
          </div>
        </div>

        {/* Recent Notifications Feed */}
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Recent Alerts</h2>
              <p className="text-xs text-zinc-400">Automated 15d, 7d, 3d, 1d notices</p>
            </div>
            <Link to="/notifications" className="text-xs font-bold text-amber-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5 overflow-hidden">
            {recentNotifications.length === 0 ? (
              <p className="text-xs text-zinc-400 py-8 text-center">No notifications yet.</p>
            ) : (
              recentNotifications.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${n.daysRemaining <= 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'}`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-900 truncate">{n.title}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
