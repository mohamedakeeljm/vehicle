import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function AddDocument() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const preselectedVehicleId = searchParams.get('vehicleId') || '';

  const [vehicles, setVehicles] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    vehicleId: preselectedVehicleId,
    documentTypeId: '',
    customTypeName: '',
    documentNumber: '',
    serviceProvider: '',
    policyOrType: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
  });

  const [file, setFile] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [vRes, tRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/documents/types'),
        ]);

        if (vRes.success) setVehicles(vRes.data);
        if (tRes.success) {
          setDocTypes(tRes.data);
          if (tRes.data.length > 0) {
            setForm((prev) => ({
              ...prev,
              documentTypeId: prev.documentTypeId || tRes.data[0].id,
            }));
          }
        }
      } catch (err) {
        addToast('Failed to load initial form data.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedType = docTypes.find((t) => t.id === form.documentTypeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId) {
      addToast('Please select a vehicle.', 'warning');
      return;
    }
    if (!form.expiryDate) {
      addToast('Please select the document expiry date.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vehicleId', form.vehicleId);
      formData.append('documentTypeId', form.documentTypeId);
      if (form.customTypeName) formData.append('customTypeName', form.customTypeName);
      if (form.documentNumber) formData.append('documentNumber', form.documentNumber);
      if (form.serviceProvider) formData.append('serviceProvider', form.serviceProvider);
      if (form.policyOrType) formData.append('policyOrType', form.policyOrType);
      if (form.issueDate) formData.append('issueDate', form.issueDate);
      formData.append('expiryDate', form.expiryDate);
      if (form.notes) formData.append('notes', form.notes);
      if (file) formData.append('attachment', file);

      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success) {
        addToast('Document added successfully! Automated reminders configured.', 'success');
        navigate(`/vehicles/${form.vehicleId}`);
      }
    } catch (err) {
      addToast(err.message || 'Failed to save document.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h1 className="text-xl font-bold text-zinc-900">Add Vehicle Document</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Revenue license, insurance, emission certificate, or custom passenger permit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Vehicle Selection & Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Select Vehicle *
              </label>
              {vehicles.length === 0 ? (
                <div className="text-xs text-rose-500">
                  No vehicles found.{' '}
                  <Link to="/vehicles/new" className="underline font-semibold text-amber-600">
                    Register a vehicle first &rarr;
                  </Link>
                </div>
              ) : (
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.brand} {v.model})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Document Category *
              </label>
              <select
                value={form.documentTypeId}
                onChange={(e) => setForm({ ...form, documentTypeId: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {docTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Document Name if category is CUSTOM */}
          {selectedType?.category === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Custom Document Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Speed Governor Calibration Certificate or Route Permit"
                value={form.customTypeName}
                onChange={(e) => setForm({ ...form, customTypeName: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          )}

          {/* Document / Policy Number & Service Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                License / Policy / Certificate No.
              </label>
              <input
                type="text"
                placeholder="e.g. RL-WP-2026-10291 or SLIC-POL-99221"
                value={form.documentNumber}
                onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Issuing Authority / Company
              </label>
              <input
                type="text"
                placeholder="e.g. Dept of Motor Traffic, Ceylinco, DriveGreen, SLIC"
                value={form.serviceProvider}
                onChange={(e) => setForm({ ...form, serviceProvider: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Plan/Type & Issue Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Policy / Coverage Type
              </label>
              <input
                type="text"
                placeholder="e.g. Comprehensive, Third Party, Annual"
                value={form.policyOrType}
                onChange={(e) => setForm({ ...form, policyOrType: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Issue Date (Optional)
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Expiry Date */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
            <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Document Expiry Date * (Calculates 15-Day Reminders)</span>
            </label>
            <input
              type="date"
              required
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed">
              Automatic email & in-app alerts will be dispatched at 15 days, 7 days, 3 days, 1 day, and on expiry date based on Sri Lanka Standard Time.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Attach Certificate Copy (PDF or Image)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-zinc-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Notes & Renewal Guidelines
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Branch agent phone number or inspection requirements..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {submitting ? 'Saving Document...' : 'Save Document & Enable Reminders'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
