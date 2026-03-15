import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Users } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/admin/fleets', label: 'Fleets', icon: <Building2 size={16} /> },
  { to: '/admin/drivers', label: 'All Drivers', icon: <Users size={16} /> },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={navItems} title="Admin" />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
