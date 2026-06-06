import { apiClient } from './api/apiClient'
import monthlyReportEndpoints from './endpoints/monthlyReportEndpoints'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const monthlyReportService = {
  async getAdminReports(filters = {}, options = {}) {
    const response = await apiClient.get(monthlyReportEndpoints.admin.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },

  async getAdminReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(monthlyReportEndpoints.admin.byStore(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `monthly-admin-store:${storeId}`,
    })

    return response.data || []
  },

  async createReport(payload, options = {}) {
    const response = await apiClient.post(monthlyReportEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateReport(reportId, payload, options = {}) {
    const response = await apiClient.put(monthlyReportEndpoints.admin.update(reportId), payload, options)

    return response.data
  },

  async uploadReports(payload, options = {}) {
    const formData = new FormData()
    formData.append('storeId', payload.storeId)
    formData.append('reportMonth', payload.reportMonth)
    formData.append('reportYear', payload.reportYear)
    formData.append('file', payload.file)

    const response = await apiClient.upload(monthlyReportEndpoints.admin.upload, formData, options)

    return response.data
  },

  async getClientReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(monthlyReportEndpoints.client.byStore(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `monthly-client-store:${storeId}`,
    })

    return response.data || []
  },
}

export default monthlyReportService
