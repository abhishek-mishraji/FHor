import { apiClient } from './api/apiClient'
import clientEndpoints from './endpoints/clientEndpoints'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const clientService = {
  async getClients(options = {}) {
    const response = await apiClient.get(clientEndpoints.admin.list, {
      ...options,
      dedupe: true,
    })

    return response.data || []
  },

  async createClient(payload, options = {}) {
    const response = await apiClient.post(clientEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateClient(clientId, payload, options = {}) {
    const response = await apiClient.put(clientEndpoints.admin.update(clientId), payload, options)

    return response.data
  },

  async updateClientStatus(clientId, status, options = {}) {
    const response = await apiClient.patch(clientEndpoints.admin.updateStatus(clientId), { status }, options)

    return response.data
  },

  async getAccessibleStores(options = {}) {
    const response = await apiClient.get(clientEndpoints.client.stores, {
      ...options,
      params: cleanParams(options.params),
      dedupe: true,
    })

    return response.data || []
  },
}

export default clientService
