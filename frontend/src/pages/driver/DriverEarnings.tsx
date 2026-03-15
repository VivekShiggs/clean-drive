import { useQuery } from '@tanstack/react-query';
import { DollarSign, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export default function DriverEarnings() {
  const { data: today } = useQuery({
    queryKey: ['today-earnings'],
    queryFn: () => api.get('/api/drivers/earnings/today').then(r => r.data),
  });

  const { data: shifts } = useQuery({
    queryKey: ['my-shifts'],
    queryFn: () => api.get('/api/shifts/my').then(r => r.data),
  });

  const completedShifts = (shifts ?? []).filter((s: any) => s.status === 'COMPLETED');
  const allTimeNet = completedShifts.reduce(
    (sum: number, s: any) => sum + Number(s.earnings?.driverNet ?? 0),
    0
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Your earnings breakdown</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-gray-400 text-xs mb-1">Today</p>
          <p className="text-2xl font-bold text-green-400">
            R {Number(today?.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs mb-1">All-time net</p>
          <p className="text-2xl font-bold text-white">
            R {allTimeNet.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card text-center">
          <p className="text-gray-400 text-xs mb-1">Completed shifts</p>
          <p className="text-2xl font-bold text-white">{completedShifts.length}</p>
        </div>
      </div>

      {/* Per-shift breakdown */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Earnings per shift</h2>
        </div>

        {completedShifts.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">
            Complete a shift to see your earnings breakdown.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Date</th>
                  <th className="pb-3 text-gray-400 font-medium">Vehicle</th>
                  <th className="pb-3 text-gray-400 font-medium">KM</th>
                  <th className="pb-3 text-gray-400 font-medium">Gross</th>
                  <th className="pb-3 text-gray-400 font-medium">Deductions</th>
                  <th className="pb-3 text-gray-400 font-medium">Your net</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedShifts.map((s: any) => {
                  const e = s.earnings;
                  const deductions = e
                    ? Number(e.platformCut) + Number(e.fleetCut)
                    : 0;
                  return (
                    <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5 text-gray-300">
                        {new Date(s.startedAt).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="py-3.5 font-mono text-gray-300">{s.vehicle?.plateNumber}</td>
                      <td className="py-3.5 text-gray-300">
                        {s.totalKm != null ? `${Number(s.totalKm).toFixed(1)} km` : '—'}
                      </td>
                      <td className="py-3.5 text-gray-300">
                        {e ? `R ${Number(e.grossAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3.5 text-red-400">
                        {e ? `- R ${deductions.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3.5 font-semibold text-green-400">
                        {e ? `R ${Number(e.driverNet).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-3.5">
                        <span className={e?.status === 'PAID' ? 'badge-green' : e?.status === 'APPROVED' ? 'badge-blue' : 'badge-yellow'}>
                          {e?.status ?? 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
