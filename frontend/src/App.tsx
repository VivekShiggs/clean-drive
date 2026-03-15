import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFleets from './pages/admin/AdminFleets';
import AdminDrivers from './pages/admin/AdminDrivers';

// Fleet
import FleetLayout from './pages/fleet/FleetLayout';
import FleetDashboard from './pages/fleet/FleetDashboard';
import FleetDrivers from './pages/fleet/FleetDrivers';
import FleetVehicles from './pages/fleet/FleetVehicles';
import FleetUpload from './pages/fleet/FleetUpload';
import FleetEarnings from './pages/fleet/FleetEarnings';

// Driver
import DriverLayout from './pages/driver/DriverLayout';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverShifts from './pages/driver/DriverShifts';
import DriverEarnings from './pages/driver/DriverEarnings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['SUPER_ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="fleets" element={<AdminFleets />} />
        <Route path="drivers" element={<AdminDrivers />} />
      </Route>

      {/* Fleet portal */}
      <Route
        path="/fleet"
        element={
          <ProtectedRoute roles={['FLEET_OWNER']}>
            <FleetLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FleetDashboard />} />
        <Route path="drivers" element={<FleetDrivers />} />
        <Route path="vehicles" element={<FleetVehicles />} />
        <Route path="upload" element={<FleetUpload />} />
        <Route path="earnings" element={<FleetEarnings />} />
      </Route>

      {/* Driver portal */}
      <Route
        path="/driver"
        element={
          <ProtectedRoute roles={['DRIVER']}>
            <DriverLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DriverDashboard />} />
        <Route path="shifts" element={<DriverShifts />} />
        <Route path="earnings" element={<DriverEarnings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
