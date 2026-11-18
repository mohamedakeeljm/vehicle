import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Car, PlusCircle, Search, ShieldCheck, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  useEffect(() => {
    async function loadVehicles() {
      try {
        const res = await api.get('/vehicles');
        if (res.success) {
          setVehicles(res.data);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  const filtered = vehicles.filter((v) => {
    const matchSearch =
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(search.toLowerCase());
    const matchProvince = !provinceFilter || v.registeredProvince === provinceFilter;
    return matchSearch && matchProvince;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">My Vehicles Garage</h1>
          <p className="text-sm text-zinc-500">Manage your vehicle registry, certificates, and compliance records</p>
        </div>
        <Link
          to="/vehicles/new"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 rounded-xl text-sm font-bold transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4 text-zinc-950" />
          <span>Add New Vehicle</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by license plate (e.g. WP CAQ-4521), brand, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <select
          value={provinceFilter}
          onChange={(e) => setProvinceFilter(e.target.value)}
          className="w-full sm:w-56 px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
        >
          <option value="">All Provinces</option>
          <option value="Western">Western Province (WP)</option>
          <option value="Central">Central Province (CP)</option>
          <option value="Southern">Southern Province (SP)</option>
          <option value="Northern">Northern Province (NP)</option>
          <option value="Eastern">Eastern Province (EP)</option>
          <option value="North Western">North Western (NW)</option>
          <option value="North Central">North Central (NC)</option>
          <option value="Uva">Uva Province (UP)</option>
          <option value="Sabaragamuwa">Sabaragamuwa (SG)</option>
        </select>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
          <Car className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-700">No vehicles found</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            {search || provinceFilter
              ? 'Try modifying your search criteria or clearing filters.'
              : 'Add your first car, motorcycle, van or three-wheeler to start tracking document expiries.'}
          </p>
          {!search && !provinceFilter && (
            <Link
              to="/vehicles/new"
              className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold rounded-xl text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-zinc-950" />
              <span>Register First Vehicle</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-300 transition-all flex flex-col"
            >
              {/* Vehicle Image Banner */}
              <div className="h-44 bg-zinc-100 relative overflow-hidden group">
                <img
                  src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'}
                  alt={vehicle.registrationNumber}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-zinc-950/90 backdrop-blur text-white text-xs font-mono font-bold tracking-wider shadow">
                    {vehicle.registrationNumber}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur text-zinc-800 text-xs font-bold shadow">
                    {vehicle.vehicleType}
                  </span>
                </div>
              </div>

              {/* Vehicle Specs */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Mfg {vehicle.manufacturingYear} • {vehicle.registeredProvince} Province
                  </p>
                  <p className="text-xs text-zinc-600 mt-2">
                    <span className="text-zinc-400">Registered Owner:</span> <span className="font-semibold text-zinc-800">{vehicle.ownerName}</span>
                  </p>
                </div>

                {/* Document Status Micro-badges */}
                <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {vehicle.documentStats.expired > 0 ? (
                      <span className="inline-flex items-center space-x-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{vehicle.documentStats.expired} Expired</span>
                      </span>
                    ) : vehicle.documentStats.expiring > 0 ? (
                      <span className="inline-flex items-center space-x-1 text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{vehicle.documentStats.expiring} Due Soon</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{vehicle.documentStats.valid} Compliant</span>
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="inline-flex items-center space-x-1 text-amber-600 hover:text-amber-700 font-bold transition-colors"
                  >
                    <span>Manage</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
