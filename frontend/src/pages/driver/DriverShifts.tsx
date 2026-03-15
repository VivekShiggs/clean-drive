import { useQuery } from '@tanstack/react-query';
import { Clock, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge-green',
  COMPLETED: 'badge-blue',
  CANCELLED: 'badge-gray',
};

export default function DriverShifts() {
  const { data: shifts, isLoading } = useQuery({
    queryKey: ['my-shifts'],
    queryFn: () => api.get('/api/shifts/my').then(r => r.data),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">My Shifts</h1>
        <p className="text-gray-400 text-sm mt-1">Your last 30 shifts</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <Clock size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Shift history</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading shifts...
          </div>
        ) : (shifts ?? []).length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No shifts recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {(shifts ?? []).map((s: any) => (
              <div key={s.id} className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-white text-sm">
                      {s.vehicle?.plateNumber}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {s.vehicle?.make} {s.vehicle?.model}
                    </span>
                  </div>
                  <span className={statusBadge[s.status] ?? 'badge-gray'}>{s.status}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Date</p>
                    <p className="text-white">{new Date(s.startedAt).toLocaleDateString('en-ZA')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Start KM</p>
                    <p className="text-white">{s.startKm.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">End KM</p>
                    <p className="text-white">{s.endKm?.toLocaleString() ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Total KM</p>
                    <p className="text-white">{s.totalKm != null ? `${Number(s.totalKm).toFixed(1)} km` : '—'}</p>
                  </div>
                </div>

                {s.earnings && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Your net earnings</p>
                    <p className="text-green-400 font-semibold">
                      R {Number(s.earnings.driverNet).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
