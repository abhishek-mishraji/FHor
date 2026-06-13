const ADMIN_ANALYTICS_PREFIX = '/api/v1/admin/analytics'
const CLIENT_ANALYTICS_PREFIX = '/api/v1/client/analytics'

const analyticsEndpoints = {
  admin: {
    reports: `${ADMIN_ANALYTICS_PREFIX}/reports`,
  },
  client: {
    reports: `${CLIENT_ANALYTICS_PREFIX}/reports`,
  },
}

export default analyticsEndpoints
