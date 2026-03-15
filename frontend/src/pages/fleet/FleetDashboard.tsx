import { useQuery } from '@tanstack/react-query';
import { Users, Truck, FileText, DollarSign, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';

export default function FleetDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: () => api.get('/api/fleet/stats').then(r => r.data),
    refetchInterval: 30_000,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Fleet Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Your fleet at a glance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <StatCard label="Total Drivers" value={stats?.totalDrivers ?? 0} icon={<Users size={22} className="text-white" />} color="bg-blue-600" />
          <StatCard label="Total Vehicles" value={stats?.totalVehicles ?? 0} icon={<Truck size={22} className="text-white" />} color="bg-green-600" />
          <StatCard label="Pending Payslips" value={stats?.pendingEarnings ?? 0} icon={<FileText size={22} className="text-white" />} color="bg-amber-600" />
          <StatCard
            label="Total Driver Earnings"
            value={`R ${Number(stats?.totalEarnings ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign size={22} className="text-white" />}
            color="bg-purple-600"
          />
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold text-white mb-2">Quick actions</h2>
        <p className="text-gray-400 text-sm">Use the sidebar to manage drivers, vehicles, upload Excel files, or review earnings and generate pay slips.</p>
      </div>
    </div>
  );
}
