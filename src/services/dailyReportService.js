import { apiClient } from './api/apiClient'
import dailyReportEndpoints from './endpoints/dailyReportEndpoints'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const dailyReportService = {
  async getAdminReports(filters = {}, options = {}) {
    const response = await apiClient.get(dailyReportEndpoints.admin.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },

  async getAdminReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(dailyReportEndpoints.admin.byStore(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `daily-admin-store:${storeId}`,
    })

    return response.data || []
  },

  async createReport(payload, options = {}) {
    const response = await apiClient.post(dailyReportEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateReport(reportId, payload, options = {}) {
    const response = await apiClient.put(dailyReportEndpoints.admin.update(reportId), payload, options)

    return response.data
  },

  async getClientReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(dailyReportEndpoints.client.byStore(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `daily-client-store:${storeId}`,
    })

    return response.data || []
  },
}

export default dailyReportService
