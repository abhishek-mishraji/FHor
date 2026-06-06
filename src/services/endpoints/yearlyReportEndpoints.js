const ADMIN_YEARLY_PREFIX = '/api/v1/admin/yearly-reports'
const CLIENT_YEARLY_PREFIX = '/api/v1/client/yearly-reports'

const yearlyReportEndpoints = {
  admin: {
    list: ADMIN_YEARLY_PREFIX,
    create: ADMIN_YEARLY_PREFIX,
    byStore: (storeId) => `${ADMIN_YEARLY_PREFIX}/store/${storeId}`,
    update: (reportId) => `${ADMIN_YEARLY_PREFIX}/${reportId}`,
  },
  client: {
    byStore: (storeId) => `${CLIENT_YEARLY_PREFIX}/store/${storeId}`,
  },
}

export default yearlyReportEndpoints
