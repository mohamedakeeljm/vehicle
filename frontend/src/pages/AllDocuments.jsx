import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, Search, ShieldCheck, AlertTriangle, XCircle, ArrowRight, Download, Filter } from 'lucide-react';

export default function AllDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await api.get('/documents');
        if (res.success) {
          setDocuments(res.data);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  const filtered = documents.filter((doc) => {
    const docName = doc.customTypeName || doc.documentType?.name || '';
    const matchSearch =
      docName.toLowerCase().includes(search.toLowerCase()) ||
      doc.vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      (doc.documentNumber && doc.documentNumber.toLowerCase().includes(search.toLowerCase())) ||
      (doc.serviceProvider && doc.serviceProvider.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = !statusFilter || doc.statusMeta.status === statusFilter;
    const matchCategory = !categoryFilter || doc.documentType?.category === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Vehicle Documents</h1>
          <p className="text-xs sm:text-sm text-zinc-500">Track and renew vehicle licenses, insurance, and certificates</p>
        </div>
        <Link
          to="/documents/new"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all text-center"
        >
          <PlusCircle className="w-4 h-4 text-zinc-950" />
          <span>Add Document</span>
        </Link>
      </div>

      {/* Mobile-Friendly Search & Filter Chips */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-zinc-200/90 shadow-sm space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by license plate, policy no, document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Scrollable Status Chips on Mobile */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { label: 'All', value: '' },
            { label: 'Valid', value: 'VALID' },
            { label: 'Expiring (<=15d)', value: 'EXPIRING' },
            { label: 'Overdue', value: 'EXPIRED' },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === chip.value
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile-Optimized Document Cards (Responsive Card View on Mobile, Clean Table on Desktop) */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
          <p className="text-sm font-bold text-zinc-700">No documents found</p>
          <p className="text-xs text-zinc-400 mt-1">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-0 sm:bg-white sm:rounded-3xl sm:border sm:border-zinc-200 sm:shadow-sm sm:overflow-hidden">
          {/* Mobile Card List (Visible on mobile screens) */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((doc) => {
              const docName = doc.customTypeName || doc.documentType?.name;
              return (
                <div
                  key={doc.id}
                  className="bg-white p-4 rounded-3xl border border-zinc-200/90 shadow-sm space-y-3 hover:border-amber-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-lg">
                          {doc.vehicle.registrationNumber}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">
                          {doc.vehicle.brand} {doc.vehicle.model}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-zinc-900 mt-1.5">{docName}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${doc.statusMeta.badgeClass}`}>
                      {doc.statusMeta.label}
                    </span>
                  </div>

                  <div className="bg-zinc-50 p-2.5 rounded-2xl text-xs space-y-1 text-zinc-600 border border-zinc-100">
                    {doc.documentNumber && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Doc / Policy:</span>
                        <span className="font-mono font-semibold">{doc.documentNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Expiry Date:</span>
                      <span className="font-bold text-zinc-800">
                        {new Date(doc.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {doc.serviceProvider && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Provider:</span>
                        <span className="truncate max-w-[170px] text-right font-medium">{doc.serviceProvider}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {doc.fileAttachmentUrl ? (
                      <a
                        href={`/api/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-zinc-600 hover:text-amber-700 text-xs font-bold"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                        <span>File</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-400">No file</span>
                    )}

                    <Link
                      to={`/vehicles/${doc.vehicleId}?renew=${doc.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-black text-xs rounded-xl shadow-sm active:scale-95 transition-all"
                    >
                      Renew Document
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Vehicle</th>
                  <th className="py-3 px-6">Document</th>
                  <th className="py-3 px-6">Provider / Policy</th>
                  <th className="py-3 px-6">Expiry Date</th>
                  <th className="py-3 px-6">Compliance Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((doc) => {
                  const docName = doc.customTypeName || doc.documentType?.name;
                  return (
                    <tr key={doc.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <Link to={`/vehicles/${doc.vehicleId}`} className="font-bold text-zinc-900 hover:text-amber-600">
                          {doc.vehicle.registrationNumber}
                        </Link>
                        <p className="text-xs text-zinc-400">{doc.vehicle.brand} {doc.vehicle.model}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-zinc-800">{docName}</span>
                        {doc.documentNumber && (
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">{doc.documentNumber}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-zinc-600">
                        <span className="font-medium text-zinc-700">{doc.serviceProvider || 'Department of Motor Traffic'}</span>
                        {doc.policyOrType && <p className="text-zinc-400">{doc.policyOrType}</p>}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-zinc-700 whitespace-nowrap">
                        {new Date(doc.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${doc.statusMeta.badgeClass}`}>
                          {doc.statusMeta.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                        {doc.fileAttachmentUrl && (
                          <a
                            href={`/api/documents/${doc.id}/download`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center p-1.5 text-zinc-500 hover:text-amber-600 rounded-lg hover:bg-zinc-100 transition-colors"
                            title="Download Certificate"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <Link
                          to={`/vehicles/${doc.vehicleId}?renew=${doc.id}`}
                          className="inline-flex items-center px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-lg text-xs shadow-sm transition-all"
                        >
                          Renew
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
