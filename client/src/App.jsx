// ============================================================
// App — Router + Protected Route + Layout
// ============================================================
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { useAuth } from './contexts/AuthContext';
import SlimHeader from './components/layout/SlimHeader';
import Footer from './components/layout/Footer';
import BottomNav from './components/layout/BottomNav';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import ServiceDetail from './pages/ServiceDetail';
import SellerProfile from './pages/SellerProfile';
import Checkout from './pages/Checkout';
import Chat from './pages/Chat';
import BuyerDashboard from './pages/Dashboard/BuyerDashboard';
import SellerDashboard from './pages/Dashboard/SellerDashboard';
import CreateService from './pages/Dashboard/CreateService';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminDisputes from './pages/Admin/AdminDisputes';

// ── Protected route — redirects to /login if not authenticated ──
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ── Layout: Home gets no header (hero has its own); all others get SlimHeader ──
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

function MainLayoutWithHeader() {
  return (
    <div className="min-h-screen flex flex-col">
      <SlimHeader />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Home — no header, hero has its own nav */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* All other public + protected routes — slim header */}
        <Route element={<MainLayoutWithHeader />}>
          <Route path="/explore" element={<Explore />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/sellers/:id" element={<SellerProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Buyer + Seller protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/:serviceId" element={<Checkout />} />
            <Route path="/messages" element={<Chat />} />
            <Route path="/messages/:conversationId" element={<Chat />} />
            <Route path="/dashboard" element={<BuyerDashboard />} />
          </Route>

          {/* Seller-only routes */}
          <Route element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN']} />}>
            <Route path="/dashboard/seller" element={<SellerDashboard />} />
            <Route path="/services/new" element={<CreateService />} />
          </Route>
        </Route>

        {/* Admin routes — no footer/navbar, full admin layout */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="disputes" element={<AdminDisputes />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-screen gap-4">
            <h1 className="text-4xl font-bold text-gray-400">404</h1>
            <p className="text-gray-500">Page not found</p>
            <a href="/" className="btn-primary">Go home</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
