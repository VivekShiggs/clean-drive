import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, Upload, DollarSign } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const navItems = [
  { to: '/fleet', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/fleet/drivers', label: 'Drivers', icon: <Users size={16} /> },
  { to: '/fleet/vehicles', label: 'Vehicles', icon: <Truck size={16} /> },
  { to: '/fleet/earnings', label: 'Earnings', icon: <DollarSign size={16} /> },
  { to: '/fleet/upload', label: 'Bulk Upload', icon: <Upload size={16} /> },
];

export default function FleetLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} title="Fleet Owner" />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
