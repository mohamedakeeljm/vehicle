import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  PlusCircle,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  X,
  History,
} from 'lucide-react';

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renewalModalDoc, setRenewalModalDoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Renewal form state
  const [renewForm, setRenewForm] = useState({
    newExpiryDate: '',
    renewalCost: '',
    referenceNumber: '',
    remarks: '',
    newDocumentNumber: '',
  });
  const [renewFile, setRenewFile] = useState(null);
  const [submittingRenew, setSubmittingRenew] = useState(false);

  const loadVehicle = async () => {
    try {
      const res = await api.get(`/vehicles/${id}`);
      if (res.success) {
        setVehicle(res.data);

        // Auto open renew modal if ?renew=<docId> is in URL
        const renewDocId = searchParams.get('renew');
        if (renewDocId) {
          const docToRenew = res.data.documents.find((d) => d.id === renewDocId);
          if (docToRenew) {
            setRenewalModalDoc(docToRenew);
          }
        }
      }
    } catch (err) {
      addToast(err.message || 'Failed to load vehicle details.', 'error');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const handleDeleteVehicle = async () => {
    try {
      const res = await api.delete(`/vehicles/${id}`);
      if (res.success) {
        addToast('Vehicle removed from garage.', 'success');
        navigate('/vehicles');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete vehicle.', 'error');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await api.delete(`/documents/${docId}`);
      if (res.success) {
        addToast('Document removed.', 'success');
        loadVehicle();
      }
    } catch (err) {
      addToast(err.message || 'Failed to remove document.', 'error');
    }
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!renewForm.newExpiryDate) {
      addToast('Please select the new expiry date.', 'warning');
      return;
    }

    setSubmittingRenew(true);
    try {
      const formData = new FormData();
      formData.append('newExpiryDate', renewForm.newExpiryDate);
      if (renewForm.renewalCost) formData.append('renewalCost', renewForm.renewalCost);
      if (renewForm.referenceNumber) formData.append('referenceNumber', renewForm.referenceNumber);
      if (renewForm.remarks) formData.append('remarks', renewForm.remarks);
      if (renewForm.newDocumentNumber) formData.append('newDocumentNumber', renewForm.newDocumentNumber);
      if (renewFile) formData.append('attachment', renewFile);

      const res = await api.put(`/documents/${renewalModalDoc.id}/renew`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success) {
        addToast(res.message, 'success');
        setRenewalModalDoc(null);
        setRenewForm({
          newExpiryDate: '',
          renewalCost: '',
          referenceNumber: '',
          remarks: '',
          newDocumentNumber: '',
        });
        setRenewFile(null);
        loadVehicle();
      }
    } catch (err) {
      addToast(err.message || 'Failed to record document renewal.', 'error');
    } finally {
      setSubmittingRenew(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/vehicles')}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Garage</span>
        </button>

        <button
          onClick={() => setDeleteConfirm(true)}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Vehicle</span>
        </button>
      </div>

      {/* Vehicle Hero Card */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-72 h-48 md:h-auto bg-zinc-100 relative flex-shrink-0">
          <img
            src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'}
            alt={vehicle.registrationNumber}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-lg bg-zinc-900 text-white font-mono font-bold text-sm tracking-wider">
                {vehicle.registrationNumber}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 font-semibold text-xs">
                {vehicle.vehicleType}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold text-xs border border-amber-200">
                {vehicle.registeredProvince} Province
              </span>
            </div>

            <h1 className="text-2xl font-black text-zinc-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manufacturing Year: <span className="font-semibold text-zinc-700">{vehicle.manufacturingYear}</span> •
              Registered Owner: <span className="font-semibold text-zinc-700">{vehicle.ownerName}</span>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6 text-xs text-zinc-600">
              <div>
                <span className="text-zinc-400 block">Total Documents</span>
                <span className="font-bold text-sm text-zinc-900">{vehicle.documents.length}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">Active Status</span>
                <span className="font-bold text-sm text-emerald-600">Compliant</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="https://eservices.motortraffic.gov.lk/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-all"
              >
                <span>Gov.lk e-License</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              </a>

              <Link
                to={`/documents/new?vehicleId=${vehicle.id}`}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
              >
                <PlusCircle className="w-4 h-4 text-zinc-950" />
                <span>Add Document</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Vehicle Documents & Renewal Status</h2>
            <p className="text-xs text-zinc-500">
              Revenue License, Insurance, Emission Test, and vehicle fitness certificates
            </p>
          </div>
        </div>

        {vehicle.documents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center">
            <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-700">No documents registered for this vehicle</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Add your vehicle revenue license and insurance policy to activate automated 15-day reminders.
            </p>
            <Link
              to={`/documents/new?vehicleId=${vehicle.id}`}
              className="inline-flex items-center space-x-1.5 mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Attach First Document</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {vehicle.documents.map((doc) => {
              const docName = doc.customTypeName || doc.documentType?.name;
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 flex flex-col justify-between hover:border-amber-300 transition-all"
                >
                  <div>
                    {/* Header of doc card */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {doc.documentType?.category?.replace(/_/g, ' ')}
                        </span>
                        <h3 className="text-base font-bold text-zinc-900 mt-1.5">{docName}</h3>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${doc.statusMeta.badgeClass}`}>
                        {doc.statusMeta.label}
                      </span>
                    </div>

                    {/* Details list */}
                    <div className="space-y-2 text-xs py-2 border-y border-zinc-100">
                      {doc.documentNumber && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Doc / Policy No:</span>
                          <span className="font-semibold text-zinc-800">{doc.documentNumber}</span>
                        </div>
                      )}
                      {doc.serviceProvider && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Provider:</span>
                          <span className="font-semibold text-zinc-800">{doc.serviceProvider}</span>
                        </div>
                      )}
                      {doc.policyOrType && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Type / Plan:</span>
                          <span className="font-semibold text-zinc-800">{doc.policyOrType}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Expiry Date:</span>
                        <span className="font-bold text-zinc-900">
                          {new Date(doc.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Renewal History Accordion Preview */}
                    {doc.renewalHistory && doc.renewalHistory.length > 0 && (
                      <div className="mt-3 p-2.5 bg-zinc-50 rounded-xl text-[11px] text-zinc-600">
                        <div className="flex items-center space-x-1.5 font-semibold text-zinc-800 mb-1">
                          <History className="w-3.5 h-3.5 text-amber-600" />
                          <span>Last Renewal ({new Date(doc.renewalHistory[0].renewedAt).toLocaleDateString('en-GB')}):</span>
                        </div>
                        <p>
                          Extended from {new Date(doc.renewalHistory[0].previousExpiryDate).toLocaleDateString('en-GB')}
                          {doc.renewalHistory[0].renewalCost ? ` • LKR ${doc.renewalHistory[0].renewalCost}` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {doc.fileAttachmentUrl ? (
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-zinc-600 hover:text-amber-600 font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Certificate File</span>
                        </a>
                      ) : (
                        <span className="text-zinc-400">No file uploaded</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setRenewalModalDoc(doc);
                          setRenewForm({
                            newExpiryDate: '',
                            renewalCost: '',
                            referenceNumber: '',
                            remarks: '',
                            newDocumentNumber: doc.documentNumber || '',
                          });
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-lg text-xs shadow-sm transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-950" />
                        <span>Renew Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Renew Document Modal */}
      {renewalModalDoc && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Renew: {renewalModalDoc.customTypeName || renewalModalDoc.documentType?.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Current Expiry: {new Date(renewalModalDoc.expiryDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              <button
                onClick={() => setRenewalModalDoc(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  New Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={renewForm.newExpiryDate}
                  onChange={(e) => setRenewForm({ ...renewForm, newExpiryDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Renewal Cost (LKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4500"
                    value={renewForm.renewalCost}
                    onChange={(e) => setRenewForm({ ...renewForm, renewalCost: e.target.value })}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Receipt / Ref No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-998822"
                    value={renewForm.referenceNumber}
                    onChange={(e) => setRenewForm({ ...renewForm, referenceNumber: e.target.value })}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Updated Document / Policy Number
                </label>
                <input
                  type="text"
                  placeholder="Leave as is or update if new number assigned"
                  value={renewForm.newDocumentNumber}
                  onChange={(e) => setRenewForm({ ...renewForm, newDocumentNumber: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Upload New Certificate (PDF or Image)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setRenewFile(e.target.files[0])}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid online at e-Revenue license counter"
                  value={renewForm.remarks}
                  onChange={(e) => setRenewForm({ ...renewForm, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRenewalModalDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRenew}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {submittingRenew ? 'Saving Renewal...' : 'Save & Extend Expiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Vehicle Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200">
            <h3 className="text-base font-bold text-zinc-900">Confirm Vehicle Deletion</h3>
            <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
              Are you sure you want to delete vehicle <strong>{vehicle.registrationNumber}</strong>? All associated
              documents, renewal records, and scheduled notifications will be permanently removed.
            </p>
            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
