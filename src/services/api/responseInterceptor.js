import { HTTP_STATUS } from '../../constants/apiConstants'
import sessionService from '../auth/sessionService'
import tokenService from '../auth/tokenService'
import authEndpoints from '../endpoints/authEndpoints'

const isAuthRoute = (url = '') =>
  [authEndpoints.login, authEndpoints.refresh, authEndpoints.logout].some((route) =>
    url.includes(route),
  )

export const setupResponseInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status
      const originalRequest = error?.config

      if (
        status === HTTP_STATUS.UNAUTHORIZED &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.skipAuthRefresh &&
        !isAuthRoute(originalRequest.url)
      ) {
        originalRequest._retry = true

        try {
          const user = await tokenService.refreshTokens()
          sessionService.setSession(user)

          return client(originalRequest)
        } catch (refreshError) {
          sessionService.expireSession(
            refreshError?.response?.data?.message ||
              'Your session has expired. Please sign in again.',
          )

          return Promise.reject(refreshError)
        }
      }

      return Promise.reject(error)
    },
  )
}
