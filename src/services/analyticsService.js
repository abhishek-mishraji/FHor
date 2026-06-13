import { apiClient } from './api/apiClient'
import analyticsEndpoints from './endpoints/analyticsEndpoints'

// Backend expects repeated query keys (storeIds=1&storeIds=2); axios would
// serialize arrays as storeIds[]=1 by default.
const serializeAnalyticsParams = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      value
        .filter((item) => item !== '' && item !== null && item !== undefined)
        .forEach((item) => searchParams.append(key, item))
      return
    }

    searchParams.append(key, value)
  })

  return searchParams.toString()
}

const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 50
const responseCache = new Map()

const readCache = (key) => {
  const entry = responseCache.get(key)

  if (!entry) {
    return null
  }

  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }

  return entry.data
}

const writeCache = (key, data) => {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    responseCache.delete(responseCache.keys().next().value)
  }

  responseCache.set(key, { data, storedAt: Date.now() })
}

const fetchAnalytics = async (url, params, options = {}) => {
  const cacheKey = `${url}?${serializeAnalyticsParams(params)}`

  if (!options.skipCache) {
    const cachedData = readCache(cacheKey)

    if (cachedData) {
      return cachedData
    }
  }

  const response = await apiClient.get(url, {
    ...options,
    params,
    paramsSerializer: serializeAnalyticsParams,
    dedupe: true,
    dedupeKey: cacheKey,
  })

  const data = response.data || { labels: [], datasets: [], meta: {} }
  writeCache(cacheKey, data)

  return data
}

const analyticsService = {
  getAdminAnalytics(params, options = {}) {
    return fetchAnalytics(analyticsEndpoints.admin.reports, params, options)
  },

  getClientAnalytics(params, options = {}) {
    return fetchAnalytics(analyticsEndpoints.client.reports, params, options)
  },

  clearCache() {
    responseCache.clear()
  },
}

export default analyticsService
