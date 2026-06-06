import { useMemo } from 'react'
import { ROLE_PERMISSIONS, ROLES } from '../constants/roleConstants'
import { useAuth } from './useAuth'

export const usePermissions = () => {
  const { user } = useAuth()

  return useMemo(() => {
    const role = user?.role || ROLES.CLIENT
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.CLIENT]

    return {
      role,
      permissions,
      isAdmin: role === ROLES.ADMIN,
      isClient: role === ROLES.CLIENT,
      can: (permission) => Boolean(permissions[permission]),
    }
  }, [user])
}
