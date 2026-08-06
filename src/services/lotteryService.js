import { apiClient } from './api/apiClient'
import lotteryEndpoints from './endpoints/lotteryEndpoints'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const lotteryService = {
  async getAdminReports(filters = {}, options = {}) {
    const response = await apiClient.get(lotteryEndpoints.admin.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },

  async getAdminReportById(reportId, options = {}) {
    const response = await apiClient.get(lotteryEndpoints.admin.byId(reportId), options)

    return response.data
  },

  async createReport(payload, options = {}) {
    const response = await apiClient.post(lotteryEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateReport(reportId, payload, options = {}) {
    const response = await apiClient.put(lotteryEndpoints.admin.update(reportId), payload, options)

    return response.data
  },

  async deleteReport(reportId, options = {}) {
    const response = await apiClient.delete(lotteryEndpoints.admin.update(reportId), options)

    return response.data
  },

  async getClientReports(filters = {}, options = {}) {
    const response = await apiClient.get(lotteryEndpoints.client.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },
}

export default lotteryService
