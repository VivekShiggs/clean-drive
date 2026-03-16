import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2, Loader2, X, ChevronDown, FileText, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  totalShifts: number;
  totalEarnings: number;
}

const emptyForm = { fullName: '', email: '', password: '', phone: '', licenceNumber: '', licenceExpiry: '' };

export default function FleetDrivers() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payslipId, setPayslipId] = useState<string | null>(null);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [error, setError] = useState('');

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ['fleet-drivers'],
    queryFn: () => api.get('/api/fleet/drivers').then(r => r.data),
  });

  const openAdd = () => { setEditDriver(null); setForm(emptyForm); setError(''); setShowModal(true); };
  const openEdit = (d: Driver) => {
    setEditDriver(d);
    setForm({ fullName: d.fullName, email: d.email, password: '', phone: d.phone ?? '', licenceNumber: d.licenceNumber ?? '', licenceExpiry: d.licenceExpiry ? d.licenceExpiry.slice(0, 10) : '' });
    setError('');
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => editDriver
      ? api.patch(`/api/fleet/drivers/${editDriver.id}`, form).then(r => r.data)
      : api.post('/api/fleet/drivers', form).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fleet-drivers'] }); setShowModal(false); },
    onError: (e: any) => setError(e.response?.data?.error ?? 'Failed to save driver'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/fleet/drivers/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fleet-drivers'] }); setDeleteId(null); },
    onError: (e: any) => alert(e.response?.data?.error ?? 'Failed to delete driver'),
  });

  const payslipMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/fleet/payslip/${id}`, { periodFrom, periodTo }).then(r => r.data),
    onSuccess: () => { setPayslipId(null); alert('Payslip generated!'); },
    onError: (e: any) => alert(e.response?.data?.error ?? 'Failed to generate payslip'),
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-gray-400 text-sm mt-1">{drivers.length} drivers in your fleet</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Driver
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading drivers...
          </div>
        ) : drivers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={36} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No drivers yet</p>
            <p className="text-gray-600 text-sm mt-1">Click "Add Driver" to add your first driver</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Driver</th>
                  <th className="pb-3 text-gray-400 font-medium">Phone</th>
                  <th className="pb-3 text-gray-400 font-medium">Licence</th>
                  <th className="pb-3 text-gray-400 font-medium">Shifts</th>
                  <th className="pb-3 text-gray-400 font-medium">Earnings</th>
                  <th className="pb-3 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <>
                    <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                      <td className="py-3.5">
                        <p className="font-medium text-white">{d.fullName}</p>
                        <p className="text-xs text-gray-400">{d.email}</p>
                      </td>
                      <td className="py-3.5 text-gray-300">{d.phone ?? '—'}</td>
                      <td className="py-3.5 text-gray-300">{d.licenceNumber ?? '—'}</td>
                      <td className="py-3.5 text-gray-300">{d.totalShifts}</td>
                      <td className="py-3.5 font-medium text-white">
                        R {d.totalEarnings.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                          <button onClick={() => setPayslipId(payslipId === d.id ? null : d.id)} className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs font-medium px-2 py-1 rounded-lg hover:bg-green-900/20 transition-colors">
                            <FileText size={13} /> Payslip <ChevronDown size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {payslipId === d.id && (
                      <tr key={`${d.id}-payslip`} className="bg-gray-800/40">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="flex flex-wrap gap-3 items-end">
                            <div>
                              <label className="label text-xs">Period from</label>
                              <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} className="input py-2 text-sm w-40" />
                            </div>
                            <div>
                              <label className="label text-xs">Period to</label>
                              <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} className="input py-2 text-sm w-40" />
                            </div>
                            <button onClick={() => payslipMutation.mutate(d.id)} disabled={!periodFrom || !periodTo || payslipMutation.isPending} className="btn-primary py-2 text-sm">
                              {payslipMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                              Generate
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
              <h2 className="text-lg font-semibold text-white">{editDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Full name *</label>
                <input className="input" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Smith" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div>
                <label className="label">{editDriver ? 'New password (leave blank to keep)' : 'Password *'}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0821234567" />
                </div>
                <div>
                  <label className="label">Licence number</label>
                  <input className="input" value={form.licenceNumber} onChange={e => setForm(f => ({ ...f, licenceNumber: e.target.value }))} placeholder="DL123456" />
                </div>
              </div>
              <div>
                <label className="label">Licence expiry</label>
                <input className="input" type="date" value={form.licenceExpiry} onChange={e => setForm(f => ({ ...f, licenceExpiry: e.target.value }))} />
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
                  {editDriver ? 'Save Changes' : 'Add Driver'}
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
            <h2 className="text-lg font-semibold text-white mb-2">Delete Driver?</h2>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone. The driver's shift history will be preserved.</p>
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
