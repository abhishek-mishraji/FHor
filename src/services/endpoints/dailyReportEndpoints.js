const ADMIN_DAILY_PREFIX = '/api/v1/admin/daily-reports'
const CLIENT_DAILY_PREFIX = '/api/v1/client/daily-reports'

const dailyReportEndpoints = {
  admin: {
    list: ADMIN_DAILY_PREFIX,
    create: ADMIN_DAILY_PREFIX,
    byStore: (storeId) => `${ADMIN_DAILY_PREFIX}/store/${storeId}`,
    update: (reportId) => `${ADMIN_DAILY_PREFIX}/${reportId}`,
  },
  client: {
    byStore: (storeId) => `${CLIENT_DAILY_PREFIX}/store/${storeId}`,
  },
}

export default dailyReportEndpoints
