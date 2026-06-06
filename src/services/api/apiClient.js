import axiosInstance from './axiosInstance'
import { ensureSuccessfulResponse } from '../../utils/responseParser'

const inflightRequests = new Map()

const buildRequestKey = (method, url, config = {}) =>
  `${method}:${url}:${JSON.stringify(config.params || {})}:${JSON.stringify(config.data || {})}`

const executeRequest = async (method, url, config = {}) => {
  const dedupeKey = config.dedupeKey || buildRequestKey(method, url, config)

  if (config.dedupe && inflightRequests.has(dedupeKey)) {
    return inflightRequests.get(dedupeKey)
  }

  const requestPromise = axiosInstance({
    method,
    url,
    ...config,
  }).then((response) => ensureSuccessfulResponse(response))

  if (config.dedupe) {
    inflightRequests.set(
      dedupeKey,
      requestPromise.finally(() => {
        inflightRequests.delete(dedupeKey)
      }),
    )
  }

  return requestPromise
}

export const apiClient = {
  request(method, url, config = {}) {
    return executeRequest(method, url, config)
  },

  get(url, config = {}) {
    return executeRequest('get', url, config)
  },

  post(url, data, config = {}) {
    return executeRequest('post', url, {
      ...config,
      data,
    })
  },

  put(url, data, config = {}) {
    return executeRequest('put', url, {
      ...config,
      data,
    })
  },

  patch(url, data, config = {}) {
    return executeRequest('patch', url, {
      ...config,
      data,
    })
  },

  delete(url, config = {}) {
    return executeRequest('delete', url, config)
  },

  upload(url, data, config = {}) {
    return executeRequest('post', url, {
      ...config,
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    })
  },
}
