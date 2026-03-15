import { useQuery } from '@tanstack/react-query';
import { Truck, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const statusBadge: Record<string, string> = {
  AVAILABLE: 'badge-green',
  ON_SHIFT: 'badge-blue',
  MAINTENANCE: 'badge-yellow',
  RETIRED: 'badge-gray',
};

export default function FleetVehicles() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: () => api.get('/api/fleet/vehicles').then(r => r.data),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Vehicles</h1>
        <p className="text-gray-400 text-sm mt-1">{vehicles?.length ?? 0} vehicles in your fleet</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading vehicles...
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
                  <th className="pb-3 text-gray-400 font-medium">Current KM</th>
                  <th className="pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(vehicles ?? []).length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No vehicles found. Use Bulk Upload to add vehicles.</td></tr>
                ) : (
                  (vehicles ?? []).map((v: any) => (
                    <tr key={v.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3.5 font-mono font-medium text-white">{v.plateNumber}</td>
                      <td className="py-3.5 text-gray-300">{v.make} {v.model}</td>
                      <td className="py-3.5 text-gray-300">{v.year}</td>
                      <td className="py-3.5 text-gray-300">{v.colour ?? '—'}</td>
                      <td className="py-3.5 text-gray-300">{v.currentKm.toLocaleString()} km</td>
                      <td className="py-3.5">
                        <span className={statusBadge[v.status] ?? 'badge-gray'}>
                          {v.status.replace('_', ' ')}
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
