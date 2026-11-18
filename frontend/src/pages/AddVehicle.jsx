import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Upload } from 'lucide-react';

const SRI_LANKAN_PROVINCES = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
];

const VEHICLE_TYPES = [
  'Car',
  'Motorcycle',
  'Van',
  'Three-Wheeler',
  'Bus',
  'Lorry',
  'SUV / Crossover',
  'Pickup Truck',
  'Tractor',
];

export default function AddVehicle() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    registrationNumber: '',
    vehicleType: 'Car',
    brand: '',
    model: '',
    manufacturingYear: new Date().getFullYear(),
    registeredProvince: 'Western',
    ownerName: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('registrationNumber', form.registrationNumber.trim().toUpperCase());
      formData.append('vehicleType', form.vehicleType);
      formData.append('brand', form.brand.trim());
      formData.append('model', form.model.trim());
      formData.append('manufacturingYear', form.manufacturingYear);
      formData.append('registeredProvince', form.registeredProvince);
      formData.append('ownerName', form.ownerName.trim());

      if (imageFile) {
        formData.append('vehicleImage', imageFile);
      }

      const res = await api.post('/vehicles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success) {
        addToast(`Vehicle ${res.data.registrationNumber} registered successfully!`, 'success');
        navigate(`/vehicles/${res.data.id}`);
      }
    } catch (err) {
      addToast(err.message || 'Failed to register vehicle.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Vehicles</span>
      </button>

      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h1 className="text-xl font-bold text-zinc-900">Register New Vehicle</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Add vehicle specifications according to your Sri Lankan Certificate of Registration (CR).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Registration Number & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Registration Number (Plate) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WP CAQ-4521 or CP ND-3344"
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase tracking-wider"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Sri Lankan format with province code optional (e.g. WP CAB-1234)</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Vehicle Type *
              </label>
              <select
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Brand / Make *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota, Honda, Bajaj, Suzuki"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prius, Hornet 160R, Wagon R"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Year & Registered Province */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Manufacturing Year *
              </label>
              <input
                type="number"
                required
                min="1950"
                max={new Date().getFullYear() + 1}
                value={form.manufacturingYear}
                onChange={(e) => setForm({ ...form, manufacturingYear: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Registered Province *
              </label>
              <select
                value={form.registeredProvince}
                onChange={(e) => setForm({ ...form, registeredProvince: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {SRI_LANKAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p} Province
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Registered Owner Name *
            </label>
            <input
              type="text"
              required
              placeholder="Full name as written on Sri Lankan Vehicle Identity Card / CR"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Vehicle Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Vehicle Photo (Optional)
            </label>
            <div className="flex items-center space-x-5">
              <label className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 rounded-2xl hover:border-amber-500 transition-colors cursor-pointer bg-zinc-50/50">
                <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                <span className="text-xs font-semibold text-zinc-600">Click to upload photo</span>
                <span className="text-[10px] text-zinc-400 mt-1">PNG, JPG, WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {previewUrl && (
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-zinc-200 flex-shrink-0 relative shadow-sm">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
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
              {submitting ? 'Registering...' : 'Register Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
