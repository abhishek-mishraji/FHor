import { apiClient } from './api/apiClient'
import gasSalesEndpoints from './endpoints/gasSalesEndpoints'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const gasSalesService = {
  async getAdminReports(filters = {}, options = {}) {
    const response = await apiClient.get(gasSalesEndpoints.admin.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },

  async getAdminReportById(reportId, options = {}) {
    const response = await apiClient.get(gasSalesEndpoints.admin.byId(reportId), options)

    return response.data
  },

  async createReport(payload, options = {}) {
    const response = await apiClient.post(gasSalesEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateReport(reportId, payload, options = {}) {
    const response = await apiClient.put(gasSalesEndpoints.admin.update(reportId), payload, options)

    return response.data
  },

  async deleteReport(reportId, options = {}) {
    const response = await apiClient.delete(gasSalesEndpoints.admin.update(reportId), options)

    return response.data
  },

  async getClientReportsByStore(storeId, options = {}) {
    const response = await apiClient.get(gasSalesEndpoints.client.byId(storeId), {
      ...options,
      dedupe: true,
      dedupeKey: `gas-client-store:${storeId}`,
    })

    return response.data || []
  },
}

export default gasSalesService
