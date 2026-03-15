import { useQuery } from '@tanstack/react-query';
import { Car, Users, Building2, TrendingUp, Activity, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: fleets } = useQuery({
    queryKey: ['admin-fleets'],
    queryFn: () => api.get('/api/admin/fleets').then(r => r.data),
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time fleet intelligence</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <StatCard label="Total Vehicles" value={stats?.totalVehicles ?? 0} icon={<Car size={22} className="text-white" />} color="bg-blue-600" />
          <StatCard label="Active Drivers" value={stats?.totalDrivers ?? 0} icon={<Users size={22} className="text-white" />} color="bg-green-600" />
          <StatCard label="Active Shifts" value={stats?.activeShifts ?? 0} icon={<Activity size={22} className="text-white" />} color="bg-amber-600" sub="Live right now" />
          <StatCard
            label="Total Earnings"
            value={`R ${Number(stats?.totalEarnings ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp size={22} className="text-white" />}
            color="bg-purple-600"
          />
        </div>
      )}

      {/* Fleets table */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Building2 size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">All Fleets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="pb-3 text-gray-400 font-medium">Fleet name</th>
                <th className="pb-3 text-gray-400 font-medium">Owner</th>
                <th className="pb-3 text-gray-400 font-medium">Drivers</th>
                <th className="pb-3 text-gray-400 font-medium">Vehicles</th>
                <th className="pb-3 text-gray-400 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {(fleets ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No fleets found</td>
                </tr>
              ) : (
                (fleets ?? []).map((f: any) => (
                  <tr key={f.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5 font-medium text-white">{f.name}</td>
                    <td className="py-3.5 text-gray-300">{f.owner?.fullName}</td>
                    <td className="py-3.5 text-gray-300">{f._count?.drivers ?? 0}</td>
                    <td className="py-3.5 text-gray-300">{f._count?.vehicles ?? 0}</td>
                    <td className="py-3.5 text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
