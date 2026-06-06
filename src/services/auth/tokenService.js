import axios from 'axios'
import environment from '../../config/environment'
import authEndpoints from '../endpoints/authEndpoints'
import { ensureSuccessfulResponse } from '../../utils/responseParser'

const refreshClient = axios.create({
  baseURL: environment.apiBaseUrl,
  timeout: environment.requestTimeout,
  withCredentials: true,
})

let refreshPromise = null

const tokenService = {
  async refreshTokens() {
    if (!refreshPromise) {
      refreshPromise = refreshClient
        .post(authEndpoints.refresh)
        .then((response) => ensureSuccessfulResponse(response).data)
        .finally(() => {
          refreshPromise = null
        })
    }

    return refreshPromise
  },
}

export default tokenService
