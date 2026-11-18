import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await api.put('/notifications/mark-all-read');
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        addToast('All notifications marked as read.', 'success');
      }
    } catch (e) {
      addToast('Failed to mark all as read.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Notification Center</h1>
          <p className="text-sm text-zinc-500">
            Automated alerts dispatched at 15d, 7d, 3d, 1d milestones and on expiry dates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all"
          >
            <CheckCheck className="w-4 h-4 text-amber-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden divide-y divide-zinc-100">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No notifications yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              When documents approach expiry, reminders will appear here automatically.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isOverdue = n.daysRemaining < 0;
            return (
              <div
                key={n.id}
                className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                  n.isRead ? 'bg-white hover:bg-zinc-50/60' : 'bg-amber-50/30 hover:bg-amber-50/50'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isOverdue ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-zinc-900">{n.title}</span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed max-w-xl">{n.message}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-400 pt-1">
                      <span>Channel: {n.channel}</span>
                      <span>•</span>
                      <span>{new Date(n.createdAt).toLocaleString('en-GB')}</span>
                      {n.document?.vehicle && (
                        <>
                          <span>•</span>
                          <Link
                            to={`/vehicles/${n.document.vehicle.id}`}
                            className="font-bold text-amber-700 hover:underline"
                          >
                            View {n.document.vehicle.registrationNumber}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 text-zinc-400 hover:text-amber-600 rounded-lg hover:bg-zinc-100 flex-shrink-0 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
