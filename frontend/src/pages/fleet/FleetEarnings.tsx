import { useQuery } from '@tanstack/react-query';
import { DollarSign, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const statusBadge: Record<string, string> = {
  PENDING: 'badge-yellow',
  APPROVED: 'badge-blue',
  PAID: 'badge-green',
  DISPUTED: 'badge-red',
};

export default function FleetEarnings() {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['fleet-earnings'],
    queryFn: () => api.get('/api/fleet/earnings').then(r => r.data),
  });

  const total = (earnings ?? []).reduce((s: number, e: any) => s + Number(e.driverNet), 0);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Earnings</h1>
          <p className="text-gray-400 text-sm mt-1">All driver earnings records</p>
        </div>
        <div className="card py-3 px-5 text-right">
          <p className="text-xs text-gray-400">Total driver net</p>
          <p className="text-xl font-bold text-white">
            R {total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Earnings records</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading earnings...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Driver</th>
                  <th className="pb-3 text-gray-400 font-medium">Date</th>
                  <th className="pb-3 text-gray-400 font-medium">KM driven</th>
                  <th className="pb-3 text-gray-400 font-medium">Gross</th>
                  <th className="pb-3 text-gray-400 font-medium">Fleet cut</th>
                  <th className="pb-3 text-gray-400 font-medium">Driver net</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(earnings ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No earnings records yet. Earnings are created when drivers complete shifts.
                    </td>
                  </tr>
                ) : (
                  (earnings ?? []).map((e: any) => (
                    <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5">
                        <p className="font-medium text-white">{e.driver?.fullName}</p>
                        <p className="text-xs text-gray-500">{e.driver?.email}</p>
                      </td>
                      <td className="py-3.5 text-gray-300">
                        {new Date(e.periodDate).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="py-3.5 text-gray-300">
                        {e.shift?.totalKm != null ? `${Number(e.shift.totalKm).toFixed(1)} km` : '—'}
                      </td>
                      <td className="py-3.5 text-gray-300">
                        R {Number(e.grossAmount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 text-gray-300">
                        R {Number(e.fleetCut).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 font-medium text-white">
                        R {Number(e.driverNet).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5">
                        <span className={statusBadge[e.status] ?? 'badge-gray'}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
