import { apiClient } from './api/apiClient'
import storeMemberEndpoints from './endpoints/storeMemberEndpoints'

const storeMemberService = {
  async getStoreMembers(storeId, options = {}) {
    const response = await apiClient.get(storeMemberEndpoints.list, {
      ...options,
      params: { storeId },
      dedupe: true,
      dedupeKey: `store-members:${storeId}`,
    })

    return response.data || []
  },

  async addStoreMember(payload, options = {}) {
    const response = await apiClient.post(storeMemberEndpoints.create, payload, options)

    return response.data
  },

  async removeStoreMember(storeId, clientId, options = {}) {
    await apiClient.delete(storeMemberEndpoints.remove(storeId, clientId), options)
  },
}

export default storeMemberService
