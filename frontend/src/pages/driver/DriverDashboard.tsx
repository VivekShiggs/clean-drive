import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, MapPin, DollarSign, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import StatCard from '../../components/StatCard';

export default function DriverDashboard() {
  const qc = useQueryClient();
  const [vehicleId, setVehicleId] = useState('');
  const [startKm, setStartKm] = useState('');
  const [endKm, setEndKm] = useState('');
  const [grossEarnings, setGrossEarnings] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  const { data: activeShift } = useQuery({
    queryKey: ['active-shift'],
    queryFn: () => api.get('/api/shifts/active').then(r => r.data),
    refetchInterval: 15_000,
  });

  const { data: todayEarnings } = useQuery({
    queryKey: ['today-earnings'],
    queryFn: () => api.get('/api/drivers/earnings/today').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: availableVehicles } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: () => api.get('/api/drivers/vehicles/available').then(r => r.data),
    enabled: !activeShift,
  });

  const startMutation = useMutation({
    mutationFn: () => api.post('/api/shifts/start', { vehicleId, startKm: Number(startKm) }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-shift'] });
      qc.invalidateQueries({ queryKey: ['available-vehicles'] });
      setVehicleId('');
      setStartKm('');
      setMsg('Shift started successfully!');
      setMsgType('success');
    },
    onError: (e: any) => {
      setMsg(e.response?.data?.error ?? 'Failed to start shift');
      setMsgType('error');
    },
  });

  const endMutation = useMutation({
    mutationFn: () =>
      api.patch(`/api/shifts/${activeShift.id}/end`, {
        endKm: Number(endKm),
        grossEarnings: Number(grossEarnings),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-shift'] });
      qc.invalidateQueries({ queryKey: ['today-earnings'] });
      qc.invalidateQueries({ queryKey: ['available-vehicles'] });
      setEndKm('');
      setGrossEarnings('');
      setMsg('Shift ended. Earnings recorded!');
      setMsgType('success');
    },
    onError: (e: any) => {
      setMsg(e.response?.data?.error ?? 'Failed to end shift');
      setMsgType('error');
    },
  });

  const shiftDuration = activeShift?.startedAt
    ? (() => {
        const diff = Date.now() - new Date(activeShift.startedAt).getTime();
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        return `${h}h ${m}m`;
      })()
    : '—';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Driver Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {activeShift ? `On shift · ${activeShift.vehicle?.plateNumber}` : 'No active shift'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Today's earnings"
          value={`R ${Number(todayEarnings?.total ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} className="text-white" />}
          color="bg-green-600"
        />
        <StatCard
          label="Shift duration"
          value={shiftDuration}
          icon={<Clock size={20} className="text-white" />}
          color="bg-blue-600"
        />
      </div>

      {/* Alert message */}
      {msg && (
        <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 mb-5 border ${
          msgType === 'success'
            ? 'bg-green-950 border-green-800 text-green-300'
            : 'bg-red-950 border-red-800 text-red-300'
        }`}>
          {msgType === 'success'
            ? <CheckCircle2 size={16} className="shrink-0" />
            : <AlertCircle size={16} className="shrink-0" />}
          {msg}
        </div>
      )}

      {/* Start shift form */}
      {!activeShift && (
        <div className="card space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Car size={18} className="text-green-400" />
            <h2 className="font-semibold text-white">Start a shift</h2>
          </div>

          <div>
            <label className="label">Select vehicle</label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className="input"
            >
              <option value="">-- Choose available vehicle --</option>
              {(availableVehicles ?? []).map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.make} {v.model} ({v.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Starting KM reading</label>
            <input
              type="number"
              value={startKm}
              onChange={e => setStartKm(e.target.value)}
              className="input"
              placeholder="e.g. 45230"
              min="0"
            />
          </div>

          <button
            onClick={() => startMutation.mutate()}
            disabled={!vehicleId || !startKm || startMutation.isPending}
            className="btn-primary w-full py-3"
          >
            {startMutation.isPending && <Loader2 size={18} className="animate-spin" />}
            {startMutation.isPending ? 'Starting...' : 'Start Shift'}
          </button>
        </div>
      )}

      {/* Active shift — end shift form */}
      {activeShift && (
        <div className="card space-y-4 mb-6 border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <h2 className="font-semibold text-white">Active shift</h2>
            </div>
            <span className="badge-green">In progress</span>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Vehicle</p>
              <p className="text-white font-medium font-mono">{activeShift.vehicle?.plateNumber}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Start KM</p>
              <p className="text-white font-medium">{activeShift.startKm.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Started at</p>
              <p className="text-white font-medium">
                {new Date(activeShift.startedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Duration</p>
              <p className="text-white font-medium">{shiftDuration}</p>
            </div>
          </div>

          <div>
            <label className="label">Ending KM reading</label>
            <input
              type="number"
              value={endKm}
              onChange={e => setEndKm(e.target.value)}
              className="input"
              placeholder="e.g. 45480"
              min={activeShift.startKm}
            />
          </div>

          <div>
            <label className="label">Gross earnings (R)</label>
            <input
              type="number"
              value={grossEarnings}
              onChange={e => setGrossEarnings(e.target.value)}
              className="input"
              placeholder="e.g. 850.00"
              min="0"
              step="0.01"
            />
          </div>

          <button
            onClick={() => endMutation.mutate()}
            disabled={!endKm || !grossEarnings || endMutation.isPending}
            className="btn-danger w-full py-3"
          >
            {endMutation.isPending && <Loader2 size={18} className="animate-spin" />}
            {endMutation.isPending ? 'Ending shift...' : 'End Shift & Record Earnings'}
          </button>
        </div>
      )}

      {/* GPS pickup placeholder */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={18} className="text-green-400" />
          <h2 className="font-semibold text-white">Pickup locations</h2>
        </div>
        <p className="text-gray-500 text-sm">
          {activeShift
            ? 'GPS pickup points assigned to your shift will appear here.'
            : 'Start a shift to see assigned pickup locations.'}
        </p>
      </div>
    </div>
  );
}
