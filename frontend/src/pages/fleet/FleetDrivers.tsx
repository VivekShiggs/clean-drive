import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, FileText, Loader2, ChevronDown } from 'lucide-react';
import api from '../../lib/api';

export default function FleetDrivers() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['fleet-drivers'],
    queryFn: () => api.get('/api/fleet/drivers').then(r => r.data),
  });

  const payslipMutation = useMutation({
    mutationFn: (driverId: string) =>
      api.post(`/api/fleet/payslip/${driverId}`, { periodFrom, periodTo }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fleet-drivers'] });
      setSelected(null);
      alert('Payslip generated successfully!');
    },
    onError: (e: any) => alert(e.response?.data?.error ?? 'Failed to generate payslip'),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Drivers</h1>
        <p className="text-gray-400 text-sm mt-1">{drivers?.length ?? 0} drivers in your fleet</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading drivers...
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
                  <th className="pb-3 text-gray-400 font-medium">Total earnings</th>
                  <th className="pb-3 text-gray-400 font-medium">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {(drivers ?? []).map((d: any) => (
                  <>
                    <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5">
                        <p className="font-medium text-white">{d.fullName}</p>
                        <p className="text-xs text-gray-400">{d.email}</p>
                      </td>
                      <td className="py-3.5 text-gray-300">{d.phone ?? '—'}</td>
                      <td className="py-3.5 text-gray-300">{d.licenceNumber ?? '—'}</td>
                      <td className="py-3.5 text-gray-300">{d.totalShifts}</td>
                      <td className="py-3.5 text-white font-medium">
                        R {d.totalEarnings.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => setSelected(selected === d.id ? null : d.id)}
                          className="flex items-center gap-1 text-green-400 hover:text-green-300 text-xs font-medium"
                        >
                          <FileText size={13} /> Generate <ChevronDown size={13} />
                        </button>
                      </td>
                    </tr>
                    {selected === d.id && (
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
                            <button
                              onClick={() => payslipMutation.mutate(d.id)}
                              disabled={!periodFrom || !periodTo || payslipMutation.isPending}
                              className="btn-primary py-2 text-sm"
                            >
                              {payslipMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                              Generate Payslip
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
    </div>
  );
}
