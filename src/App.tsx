import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/shell/AppShell';
import { PARTNER_ROLES, useAuth } from '@/features/auth/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { isLoginTransition } from '@/lib/loginTransition';

const LoginPage      = lazy(() => import('@/pages/LoginPage'));
const DashboardPage  = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage    = lazy(() => import('@/pages/ProfilePage'));
const BranchesPage   = lazy(() => import('@/pages/BranchesPage'));
const SalesPage      = lazy(() => import('@/pages/SalesPage'));
const OrdersPage     = lazy(() => import('@/pages/OrdersPage'));
const AnalyticsPage  = lazy(() => import('@/pages/AnalyticsPage'));
const StaffPage      = lazy(() => import('@/pages/StaffPage'));

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

const App = () => {
  const { user, loading } = useAuth();
  const isPartner = user ? PARTNER_ROLES.includes(user.role as typeof PARTNER_ROLES[number]) : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user && !isPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <p className="text-lg font-semibold">Доступ запрещён</p>
          <p className="text-sm text-muted-foreground mt-1">Вы не можете войти в партнёрскую панель.</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={(user && !isLoginTransition()) ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={user ? <AppShell /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="branches" element={<BranchesPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="staff" element={<StaffPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
