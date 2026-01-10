import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import PublicMenu from './pages/PublicMenu';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/admin/Login';
import Dishes from './pages/admin/Dishes';
import Categories from './pages/admin/Categories';
import QrCodeGenerator from './pages/admin/QrCode';
import Users from './pages/admin/Users';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<PublicMenu />} />
          </Route>

          {/* Admin Login */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>

            {/* Admin Dashboard & Users - ADMIN ONLY */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} fallbackPath="/admin/dishes" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
            </Route>

            {/* Dishes, Categories, QR - ADMIN & WAITER */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'waiter']} />}>
              <Route path="dishes" element={<Dishes />} />
              <Route path="categories" element={<Categories />} />
              <Route path="qr" element={<QrCodeGenerator />} />
            </Route>

          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
