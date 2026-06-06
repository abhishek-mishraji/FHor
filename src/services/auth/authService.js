import { apiClient } from '../api/apiClient'
import authEndpoints from '../endpoints/authEndpoints'
import tokenService from './tokenService'

const authService = {
  login(credentials, options = {}) {
    return apiClient.post(authEndpoints.login, credentials, {
      ...options,
      skipAuthRefresh: true,
    })
  },

  logout(options = {}) {
    return apiClient.post(authEndpoints.logout, null, {
      ...options,
      skipAuthRefresh: true,
      skipGlobalError: true,
    })
  },

  refreshSession() {
    return tokenService.refreshTokens()
  },

  validateSession() {
    return tokenService.refreshTokens()
  },
}

export default authService
