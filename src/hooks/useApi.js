import { useCallback, useEffect, useRef, useState } from 'react'

const isAbortError = (error) =>
  error?.name === 'AbortError' || error?.code === 'ERR_CANCELED'

export const useApi = (
  requestFactory,
  {
    auto = true,
    deps = [],
    initialData = null,
    onSuccess,
    onError,
  } = {},
) => {
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(auto)
  const abortControllerRef = useRef(null)
  const requestFactoryRef = useRef(requestFactory)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  requestFactoryRef.current = requestFactory
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  const depsSignature = JSON.stringify(deps)

  const executeRequest = useCallback(async (options = {}) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    setLoading(true)
    setError(null)

    try {
      const result = await requestFactoryRef.current({
        signal: controller.signal,
        ...options,
      })

      setData(result)
      onSuccessRef.current?.(result)

      return result
    } catch (requestError) {
      if (isAbortError(requestError)) {
        return null
      }

      setError(requestError)
      onErrorRef.current?.(requestError)
      throw requestError
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!auto) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      executeRequest().catch(() => {})
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      abortControllerRef.current?.abort()
    }
  }, [auto, depsSignature, executeRequest])

  return {
    data,
    error,
    loading,
    setData,
    execute: executeRequest,
  }
}
