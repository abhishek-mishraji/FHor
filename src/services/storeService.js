import { apiClient } from './api/apiClient'
import storeEndpoints from './endpoints/storeEndpoints'
import clientService from './clientService'

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined),
  )

const storeService = {
  async getStores(filters = {}, options = {}) {
    const response = await apiClient.get(storeEndpoints.admin.list, {
      ...options,
      params: cleanParams(filters),
      dedupe: true,
    })

    return response.data || []
  },

  async getStore(storeId, options = {}) {
    const response = await apiClient.get(storeEndpoints.admin.byId(storeId), options)

    return response.data
  },

  async createStore(payload, options = {}) {
    const response = await apiClient.post(storeEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateStore(storeId, payload, options = {}) {
    const response = await apiClient.put(storeEndpoints.admin.update(storeId), payload, options)

    return response.data
  },

  async updateStoreStatus(storeId, status, options = {}) {
    const response = await apiClient.patch(storeEndpoints.admin.updateStatus(storeId), null, {
      ...options,
      params: { status },
    })

    return response.data
  },

  getClientStores: clientService.getAccessibleStores,
}

export default storeService
