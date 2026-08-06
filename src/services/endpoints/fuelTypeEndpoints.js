const ADMIN_FUEL_TYPE_PREFIX = '/api/v1/admin/fuel-types'

const fuelTypeEndpoints = {
  admin: {
    list: ADMIN_FUEL_TYPE_PREFIX,
    create: ADMIN_FUEL_TYPE_PREFIX,
    byId: (id) => `${ADMIN_FUEL_TYPE_PREFIX}/${id}`,
    update: (id) => `${ADMIN_FUEL_TYPE_PREFIX}/${id}`,
    delete: (id) => `${ADMIN_FUEL_TYPE_PREFIX}/${id}`,
  },
}

export default fuelTypeEndpoints
