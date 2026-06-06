import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import authService from '../services/auth/authService'
import sessionService from '../services/auth/sessionService'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => ({
    ...sessionService.getSession(),
    isInitializing: true,
  }))

  useEffect(() => {
    const unsubscribe = sessionService.subscribe((session) => {
      setAuthState((currentState) => ({
        ...currentState,
        ...session,
      }))
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let isMounted = true

    const bootstrapSession = async () => {
      try {
        const user = await authService.validateSession()

        if (isMounted) {
          sessionService.setSession(user)
        }
      } catch {
        if (isMounted) {
          sessionService.clearSession()
        }
      } finally {
        if (isMounted) {
          setAuthState((currentState) => ({
            ...currentState,
            isInitializing: false,
          }))
        }
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials)

    startTransition(() => {
      sessionService.setSession(response.data)
    })

    return response.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      sessionService.clearSession('Logged out successfully.')
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const user = await authService.refreshSession()
    sessionService.setSession(user)

    return user
  }, [])

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      refreshSession,
    }),
    [authState, login, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
