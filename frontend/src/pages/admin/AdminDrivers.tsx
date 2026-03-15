import { useQuery } from '@tanstack/react-query';
import { Users, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDrivers() {
  const { data: drivers, isLoading } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => api.get('/api/admin/drivers').then(r => r.data),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">All Drivers</h1>
        <p className="text-gray-400 text-sm mt-1">{drivers?.length ?? 0} drivers registered</p>
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
                  <th className="pb-3 text-gray-400 font-medium">Fleet</th>
                  <th className="pb-3 text-gray-400 font-medium">Total shifts</th>
                </tr>
              </thead>
              <tbody>
                {(drivers ?? []).map((d: any) => (
                  <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5">
                      <p className="font-medium text-white">{d.fullName}</p>
                      <p className="text-xs text-gray-400">{d.email}</p>
                    </td>
                    <td className="py-3.5 text-gray-300">{d.phone ?? '—'}</td>
                    <td className="py-3.5 text-gray-300">{d.fleet?.name ?? '—'}</td>
                    <td className="py-3.5 text-gray-300">{d._count?.shifts ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
