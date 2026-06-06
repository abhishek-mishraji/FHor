export const setupRequestInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      const nextConfig = {
        ...config,
        withCredentials: true,
        headers: {
          Accept: 'application/json',
          ...config.headers,
        },
        metadata: {
          requestStartedAt: Date.now(),
        },
      }

      return nextConfig
    },
    (error) => Promise.reject(error),
  )
}
