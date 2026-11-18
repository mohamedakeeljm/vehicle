import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { History, Shield, ArrowUpRight } from 'lucide-react';

export default function RenewalHistory() {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRenewals() {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.success && res.data.recentRenewals) {
          setRenewals(res.data.recentRenewals);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRenewals();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Document Renewal Audit History</h1>
        <p className="text-sm text-zinc-500">
          Permanent log of previous renewal transactions, payment receipts, and extended expiry dates
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          </div>
        ) : renewals.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No renewals recorded yet</p>
            <p className="text-xs text-zinc-400 mt-1">
              Whenever you extend a vehicle document, the audit trail will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {renewals.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">
                      {r.document?.vehicle?.registrationNumber} – {r.document?.documentType?.name || 'Document'}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Extended from{' '}
                      <span className="font-semibold text-zinc-700">
                        {new Date(r.previousExpiryDate).toLocaleDateString('en-GB')}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-emerald-700">
                        {new Date(r.newExpiryDate).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                    {r.remarks && <p className="text-xs text-zinc-600 mt-1 italic">"{r.remarks}"</p>}
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Ref / Receipt: {r.referenceNumber || 'N/A'} • Renewed on {new Date(r.renewedAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center flex-shrink-0">
                  {r.renewalCost ? (
                    <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                      LKR {r.renewalCost.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Cost not recorded</span>
                  )}
                  {r.document?.vehicle && (
                    <Link
                      to={`/vehicles/${r.document.vehicle.id}`}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 mt-1 flex items-center space-x-1"
                    >
                      <span>View Vehicle</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
