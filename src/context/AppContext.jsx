import { useCallback, useEffect, useMemo, useState } from 'react'
import environment from '../config/environment'
import { AppContext } from './appContext'

let toastSequence = 0

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [selectedStoreId, setSelectedStoreId] = useState('')

  const dismissToast = useCallback((toastId) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId))
  }, [])

  const notify = useCallback((toast) => {
    const id = ++toastSequence

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id,
        duration: environment.toastDuration,
        type: 'info',
        ...toast,
      },
    ])

    return id
  }, [])

  useEffect(() => {
    if (!toasts.length) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      dismissToast(toasts[0].id)
    }, toasts[0].duration)

    return () => window.clearTimeout(timeoutId)
  }, [dismissToast, toasts])

  const value = useMemo(
    () => ({
      toasts,
      notify,
      dismissToast,
      selectedStoreId,
      setSelectedStoreId,
    }),
    [dismissToast, notify, selectedStoreId, toasts],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
