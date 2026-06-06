const ADMIN_MONTHLY_PREFIX = '/api/v1/admin/monthly-reports'
const CLIENT_MONTHLY_PREFIX = '/api/v1/client/monthly-reports'

const monthlyReportEndpoints = {
  admin: {
    list: ADMIN_MONTHLY_PREFIX,
    create: ADMIN_MONTHLY_PREFIX,
    byStore: (storeId) => `${ADMIN_MONTHLY_PREFIX}/store/${storeId}`,
    update: (reportId) => `${ADMIN_MONTHLY_PREFIX}/${reportId}`,
    upload: `${ADMIN_MONTHLY_PREFIX}/upload`,
  },
  client: {
    byStore: (storeId) => `${CLIENT_MONTHLY_PREFIX}/store/${storeId}`,
  },
}

export default monthlyReportEndpoints
