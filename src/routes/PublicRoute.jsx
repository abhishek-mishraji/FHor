import { Navigate, Outlet } from 'react-router-dom'
import { DEFAULT_ROLE_HOME } from '../constants/routeConstants'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'

const PublicRoute = () => {
  const { isAuthenticated, isInitializing, user } = useAuth()

  if (isInitializing) {
    return <Loader label="Checking session..." />
  }

  if (isAuthenticated) {
    return <Navigate to={DEFAULT_ROLE_HOME[user?.role]} replace />
  }

  return <Outlet />
}

export default PublicRoute
