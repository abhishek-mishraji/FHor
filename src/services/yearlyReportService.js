import { apiClient } from './api/apiClient'
import yearlyReportEndpoints from './endpoints/yearlyReportEndpoints'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const yearlyReportService = {
  async getAdminReports(filters = {}, options = {}) {
    const response = await apiClient.get(yearlyReportEndpoints.admin.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },

  async getAdminReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(yearlyReportEndpoints.admin.byStore(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `yearly-admin-store:${storeId}`,
    })

    return response.data || []
  },

  async createReport(payload, options = {}) {
    const response = await apiClient.post(yearlyReportEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateReport(reportId, payload, options = {}) {
    const response = await apiClient.put(yearlyReportEndpoints.admin.update(reportId), payload, options)

    return response.data
  },

  async getClientReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(yearlyReportEndpoints.client.byStore(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `yearly-client-store:${storeId}`,
    })

    return response.data || []
  },
}

export default yearlyReportService
