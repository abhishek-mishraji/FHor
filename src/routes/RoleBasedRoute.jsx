import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from '../constants/routeConstants'
import { useAuth } from '../hooks/useAuth'

const RoleBasedRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth()

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={ROUTES.unauthorized} replace />
  }

  return <Outlet />
}

export default RoleBasedRoute
