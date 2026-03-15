import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Clock, DollarSign } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const navItems = [
  { to: '/driver', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/driver/shifts', label: 'My Shifts', icon: <Clock size={16} /> },
  { to: '/driver/earnings', label: 'Earnings', icon: <DollarSign size={16} /> },
];

export default function DriverLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} title="Driver" />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
