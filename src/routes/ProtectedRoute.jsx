import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Loader from '../components/ui/Loader'
import { ROUTES } from '../constants/routeConstants'
import { useAuth } from '../hooks/useAuth'

const ProtectedRoute = () => {
  const location = useLocation()
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <Loader label="Restoring your session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
