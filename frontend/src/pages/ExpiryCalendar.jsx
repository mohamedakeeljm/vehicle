import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExpiryCalendar() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/documents');
        if (res.success) setDocuments(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const docsByDay = {};
  documents.forEach((doc) => {
    const d = new Date(doc.expiryDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!docsByDay[day]) docsByDay[day] = [];
      docsByDay[day].push(doc);
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Document Expiry Calendar</h1>
          <p className="text-sm text-zinc-500">Visual calendar of upcoming renewals and compliance milestones</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-zinc-200/80 shadow-sm">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-zinc-800 text-sm px-3 min-w-[140px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden p-6">
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] bg-zinc-50/50 rounded-xl border border-dashed border-zinc-100"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayDocs = docsByDay[day] || [];
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === day;

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  isToday
                    ? 'border-amber-500 bg-amber-50/20 shadow-sm'
                    : 'border-zinc-100 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-700'
                    }`}
                  >
                    {day}
                  </span>
                  {dayDocs.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      {dayDocs.length} due
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-y-auto max-h-[75px]">
                  {dayDocs.map((doc) => (
                    <Link
                      key={doc.id}
                      to={`/vehicles/${doc.vehicleId}`}
                      className="block p-1 rounded bg-zinc-50 hover:bg-amber-50 border border-zinc-200 text-[10px] font-medium text-zinc-800 truncate transition-colors"
                      title={`${doc.vehicle.registrationNumber}: ${doc.customTypeName || doc.documentType?.name}`}
                    >
                      <span className="font-bold text-amber-700">{doc.vehicle.registrationNumber}</span>: {doc.customTypeName || doc.documentType?.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
