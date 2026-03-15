import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2 } from 'lucide-react';
import api from '../../lib/api';

export default function AdminFleets() {
  const { data: fleets, isLoading } = useQuery({
    queryKey: ['admin-fleets'],
    queryFn: () => api.get('/api/admin/fleets').then(r => r.data),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Fleets</h1>
        <p className="text-gray-400 text-sm mt-1">All registered fleets on the platform</p>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading fleets...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-3 text-gray-400 font-medium">Fleet</th>
                  <th className="pb-3 text-gray-400 font-medium">Company Reg</th>
                  <th className="pb-3 text-gray-400 font-medium">Owner</th>
                  <th className="pb-3 text-gray-400 font-medium">Drivers</th>
                  <th className="pb-3 text-gray-400 font-medium">Vehicles</th>
                  <th className="pb-3 text-gray-400 font-medium">Platform cut</th>
                  <th className="pb-3 text-gray-400 font-medium">Fleet cut</th>
                </tr>
              </thead>
              <tbody>
                {(fleets ?? []).map((f: any) => (
                  <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5 font-medium text-white flex items-center gap-2">
                      <Building2 size={14} className="text-green-400" /> {f.name}
                    </td>
                    <td className="py-3.5 text-gray-400">{f.companyReg ?? '—'}</td>
                    <td className="py-3.5 text-gray-300">{f.owner?.fullName}<br /><span className="text-xs text-gray-500">{f.owner?.email}</span></td>
                    <td className="py-3.5 text-gray-300">{f._count?.drivers ?? 0}</td>
                    <td className="py-3.5 text-gray-300">{f._count?.vehicles ?? 0}</td>
                    <td className="py-3.5 text-gray-300">{(f.platformCutBps / 100).toFixed(0)}%</td>
                    <td className="py-3.5 text-gray-300">{(f.fleetCutBps / 100).toFixed(0)}%</td>
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
