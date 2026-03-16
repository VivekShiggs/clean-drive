import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, Pencil, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  colour?: string;
  currentKm: number;
  status: string;
}

const statusBadge: Record<string, string> = {
  AVAILABLE: 'badge-green',
  ON_SHIFT: 'badge-blue',
  MAINTENANCE: 'badge-yellow',
  RETIRED: 'badge-gray',
};

const emptyForm = { plateNumber: '', make: '', model: '', year: '', colour: '', currentKm: '', status: 'AVAILABLE' };

export default function FleetVehicles() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['fleet-vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });

  const openAdd = () => { setEditVehicle(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setForm({ plateNumber: v.plateNumber, make: v.make, model: v.model, year: String(v.year), colour: v.colour ?? '', currentKm: String(v.currentKm), status: v.status });
    setError('');
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => editVehicle
      ? api.patch(`/api/fleet/vehicles/${editVehicle.id}`, form).then(r => r.data)
      : api.post('/api/fleet/vehicles', form).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fleet-vehicles'] }); setShowModal(false); },
    onError: (e: any) => setError(e.response?.data?.error ?? 'Failed to save vehicle'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/fleet/vehicles/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fleet-vehicles'] }); setDeleteId(null); },
    onError: (e: any) => alert(e.response?.data?.error ?? 'Failed to delete vehicle'),
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicles</h1>
          <p className="text-gray-400 text-sm mt-1">{vehicles.length} vehicles in your fleet</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-12 text-center">
            <Truck size={36} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No vehicles yet</p>
            <p className="text-gray-600 text-sm mt-1">Click "Add Vehicle" to add your first vehicle</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Plate</th>
                  <th className="pb-3 text-gray-400 font-medium">Vehicle</th>
                  <th className="pb-3 text-gray-400 font-medium">Year</th>
                  <th className="pb-3 text-gray-400 font-medium">Colour</th>
                  <th className="pb-3 text-gray-400 font-medium">KM</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                  <th className="pb-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 font-mono font-medium text-white">{v.plateNumber}</td>
                    <td className="py-3.5 text-gray-300">{v.make} {v.model}</td>
                    <td className="py-3.5 text-gray-300">{v.year}</td>
                    <td className="py-3.5 text-gray-300">{v.colour ?? '—'}</td>
                    <td className="py-3.5 text-gray-300">{Number(v.currentKm).toLocaleString()} km</td>
                    <td className="py-3.5">
                      <span className={statusBadge[v.status] ?? 'badge-gray'}>
                        {v.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(v.id)}
                          disabled={v.status === 'ON_SHIFT'}
                          className="p-1.5 rounded-lg hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={v.status === 'ON_SHIFT' ? 'Cannot delete — vehicle on shift' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Plate number *</label>
                <input className="input font-mono" value={form.plateNumber} onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))} placeholder="CA 123-456" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Make *</label>
                  <input className="input" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Toyota" />
                </div>
                <div>
                  <label className="label">Model *</label>
                  <input className="input" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Corolla" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Year *</label>
                  <input className="input" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2022" min="1990" max="2030" />
                </div>
                <div>
                  <label className="label">Colour</label>
                  <input className="input" value={form.colour} onChange={e => setForm(f => ({ ...f, colour: e.target.value }))} placeholder="White" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Current KM</label>
                  <input className="input" type="number" value={form.currentKm} onChange={e => setForm(f => ({ ...f, currentKm: e.target.value }))} placeholder="45000" min="0" />
                </div>
                {editVehicle && (
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="AVAILABLE">Available</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary flex-1">
                  {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  {editVehicle ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 size={32} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Delete Vehicle?</h2>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="btn-danger flex-1">
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
