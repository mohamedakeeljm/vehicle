import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Users,
  Car,
  FileText,
  Play,
  RotateCw,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [jobRuns, setJobRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [activeTab, setActiveTab] = useState('expiring');

  const loadAdminData = async () => {
    try {
      const [sRes, uRes, eRes, lRes, jRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/expiring-documents'),
        api.get('/admin/delivery-logs'),
        api.get('/admin/job-runs'),
      ]);

      if (sRes.success) setStats(sRes.data);
      if (uRes.success) setUsers(uRes.data);
      if (eRes.success) setExpiringDocs(eRes.data);
      if (lRes.success) setDeliveryLogs(lRes.data);
      if (jRes.success) setJobRuns(jRes.data);
    } catch (err) {
      addToast(err.message || 'Failed to load administrator telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleTriggerScheduler = async () => {
    setTriggering(true);
    try {
      const res = await api.post('/admin/trigger-scheduler');
      if (res.success) {
        addToast(
          `Scheduler completed! Scanned: ${res.result.scannedCount}, Reminders: ${res.result.remindersSent}`,
          'success'
        );
        loadAdminData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to trigger scheduler.', 'error');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-zinc-800">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">System Administration Console</h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              Live audit logs, background scheduler triggers, and vehicle compliance telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors border border-zinc-800"
            title="Refresh Telemetry"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleTriggerScheduler}
            disabled={triggering}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current text-zinc-950" />
            <span>{triggering ? 'Scanning...' : 'Trigger Scheduler Now'}</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between hover:border-amber-300 transition-all">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Registered Users</p>
            <p className="text-2xl font-black text-zinc-900 mt-1">{stats?.totalUsers || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-all">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Vehicles</p>
            <p className="text-2xl font-black text-zinc-900 mt-1">{stats?.totalVehicles || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between hover:border-amber-300 transition-all">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tracked Documents</p>
            <p className="text-2xl font-black text-zinc-900 mt-1">{stats?.totalDocuments || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between hover:border-amber-300 transition-all">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Delivery Audits</p>
            <p className="text-2xl font-black text-zinc-900 mt-1">{stats?.deliveryStats?.total || 0}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-200 px-6 space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('expiring')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'expiring'
                ? 'border-amber-500 text-amber-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Expiring Documents Monitor ({expiringDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            User Accounts ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Delivery Audit Logs ({deliveryLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === 'jobs'
                ? 'border-amber-500 text-amber-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Scheduler Job History ({jobRuns.length})
          </button>
        </div>

        {/* Tab 1: Expiring Documents */}
        {activeTab === 'expiring' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Vehicle</th>
                  <th className="py-3 px-6">Document</th>
                  <th className="py-3 px-6">Registered Owner</th>
                  <th className="py-3 px-6">Expiry Date</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {expiringDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-50/60">
                    <td className="py-3.5 px-6 font-bold text-zinc-900">
                      {doc.registrationNumber}
                      <p className="text-xs text-zinc-400 font-normal">{doc.brandModel}</p>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-zinc-800">{doc.documentName}</td>
                    <td className="py-3.5 px-6 text-xs text-zinc-600">
                      {doc.ownerName}
                      <p className="text-zinc-400">{doc.ownerEmail}</p>
                    </td>
                    <td className="py-3.5 px-6 text-xs whitespace-nowrap">
                      {new Date(doc.expiryDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${doc.statusMeta.badgeClass}`}>
                        {doc.statusMeta.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Users */}
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Full Name</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Sri Lankan Phone</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Vehicles Owned</th>
                  <th className="py-3 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/60">
                    <td className="py-3.5 px-6 font-bold text-zinc-900">{u.fullName}</td>
                    <td className="py-3.5 px-6 text-zinc-600">{u.email}</td>
                    <td className="py-3.5 px-6 text-zinc-600 font-mono text-xs">{u.phoneNumber}</td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-zinc-700">{u._count?.vehicles || 0}</td>
                    <td className="py-3.5 px-6 text-xs text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Delivery Logs */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Channel</th>
                  <th className="py-3 px-6">Recipient</th>
                  <th className="py-3 px-6">Vehicle / Doc</th>
                  <th className="py-3 px-6">Milestone</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {deliveryLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/60 text-xs">
                    <td className="py-3 px-6 font-bold text-zinc-800">{log.channel}</td>
                    <td className="py-3 px-6 text-zinc-600">{log.recipient}</td>
                    <td className="py-3 px-6 font-semibold text-zinc-900">
                      {log.document?.vehicle?.registrationNumber || 'N/A'}
                      <p className="text-zinc-400 font-normal">{log.document?.documentType?.name}</p>
                    </td>
                    <td className="py-3 px-6 font-mono font-semibold">
                      {log.daysRemaining <= 0 ? `${log.daysRemaining}d (Overdue)` : `${log.daysRemaining}d Before`}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-zinc-400">
                      {new Date(log.sentAt).toLocaleString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Job History */}
        {activeTab === 'jobs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Job Name</th>
                  <th className="py-3 px-6">Execution Date</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Scanned</th>
                  <th className="py-3 px-6">Reminders Sent</th>
                  <th className="py-3 px-6">Failures</th>
                  <th className="py-3 px-6">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobRuns.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-50/60 text-xs">
                    <td className="py-3 px-6 font-bold text-zinc-800">{job.jobName}</td>
                    <td className="py-3 px-6 text-zinc-600">
                      {new Date(job.executionDate).toLocaleString('en-GB')}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          job.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-semibold">{job.scannedCount}</td>
                    <td className="py-3 px-6 font-semibold text-emerald-700">{job.remindersSent}</td>
                    <td className="py-3 px-6 font-semibold text-rose-700">{job.failuresCount}</td>
                    <td className="py-3 px-6 font-mono text-zinc-500">{job.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
