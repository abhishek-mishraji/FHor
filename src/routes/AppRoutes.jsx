import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Loader from '../components/ui/Loader'
import { ROUTES } from '../constants/routeConstants'
import { ROLES } from '../constants/roleConstants'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import RoleBasedRoute from './RoleBasedRoute'

const LoginPage = lazy(() => import('../pages/Login/LoginPage'))
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'))
const ClientsPage = lazy(() => import('../pages/Clients/ClientsPage'))
const StoresPage = lazy(() => import('../pages/Stores/StoresPage'))
const StoreMembersPage = lazy(() => import('../pages/StoreMembers/StoreMembersPage'))
const DailyReportsPage = lazy(() => import('../pages/DailyReports/DailyReportsPage'))
const MonthlyReportsPage = lazy(() => import('../pages/MonthlyReports/MonthlyReportsPage'))
const YearlyReportsPage = lazy(() => import('../pages/YearlyReports/YearlyReportsPage'))
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'))
const UnauthorizedPage = lazy(() => import('../pages/Unauthorized/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('../pages/NotFound/NotFoundPage'))

const DefaultRedirect = () => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <Navigate to={ROUTES.dashboard} replace state={{ role: user?.role }} />
}

const AppRoutes = () => (
  <Suspense fallback={<Loader label="Loading screen..." />}>
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
      </Route>

      <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />

      <Route path={ROUTES.appRoot} element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="reports/daily" element={<DailyReportsPage />} />
          <Route path="reports/monthly" element={<MonthlyReportsPage />} />
          <Route path="reports/yearly" element={<YearlyReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="clients" element={<ClientsPage />} />
            <Route path="store-members" element={<StoreMembersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<DefaultRedirect />} />
      <Route path={ROUTES.notFound} element={<NotFoundPage />} />
    </Routes>
  </Suspense>
)

export default AppRoutes
