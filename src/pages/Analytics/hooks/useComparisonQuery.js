import { useCallback, useRef } from 'react'
import { useApi } from '../../../hooks/useApi'
import analyticsService from '../../../services/analyticsService'
import { composeComparison } from '../../../services/comparisonComposer'
import { handleServiceError } from '../../../utils/errorHandler'

// Runs a comparison on demand: picks the admin or client analytics endpoint,
// threads the abort signal into every underlying request, and surfaces
// failures as toasts. Keeps the last run so the error state can Retry.
export const useComparisonQuery = ({ isAdmin, notify }) => {
  const lastRunRef = useRef(null)

  const query = useApi(
    ({ signal, values, departmentNames }) => {
      const service = isAdmin
        ? analyticsService.getAdminAnalytics
        : analyticsService.getClientAnalytics
      const fetcher = (params) => service(params, { signal })

      return composeComparison(values, fetcher, isAdmin, { departmentNames })
    },
    {
      auto: false,
      onError: (error) => handleServiceError(error, notify),
    },
  )

  const run = useCallback(
    (values, departmentNames) => {
      lastRunRef.current = { values, departmentNames }

      return query.execute({ values, departmentNames }).catch(() => null)
    },
    [query],
  )

  const retry = useCallback(() => {
    if (lastRunRef.current) {
      query.execute(lastRunRef.current).catch(() => null)
    }
  }, [query])

  const reset = useCallback(() => {
    lastRunRef.current = null
    query.setData(null)
  }, [query])

  return {
    result: query.data,
    loading: query.loading,
    error: query.error,
    run,
    retry,
    reset,
  }
}
