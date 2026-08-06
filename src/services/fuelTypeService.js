import { apiClient } from './api/apiClient'
import fuelTypeEndpoints from './endpoints/fuelTypeEndpoints'

const fuelTypeService = {
  async getFuelTypes(options = {}) {
    const response = await apiClient.get(fuelTypeEndpoints.admin.list, {
      ...options,
      dedupe: true,
    })

    return response.data || []
  },

  async getFuelTypeById(id, options = {}) {
    const response = await apiClient.get(fuelTypeEndpoints.admin.byId(id), options)

    return response.data
  },

  async createFuelType(payload, options = {}) {
    const response = await apiClient.post(fuelTypeEndpoints.admin.create, payload, options)

    return response.data
  },

  async updateFuelType(id, payload, options = {}) {
    const response = await apiClient.put(fuelTypeEndpoints.admin.update(id), payload, options)

    return response.data
  },

  async deleteFuelType(id, options = {}) {
    const response = await apiClient.delete(fuelTypeEndpoints.admin.delete(id), options)

    return response.data
  },
}

export default fuelTypeService
