const AUTH_PREFIX = '/api/v1/auth'

const authEndpoints = {
  login: `${AUTH_PREFIX}/login`,
  refresh: `${AUTH_PREFIX}/refresh`,
  logout: `${AUTH_PREFIX}/logout`,
}

export default authEndpoints
