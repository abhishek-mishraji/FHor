const ADMIN_STORE_PREFIX = '/api/v1/admin/stores'

const storeEndpoints = {
  admin: {
    list: ADMIN_STORE_PREFIX,
    create: ADMIN_STORE_PREFIX,
    byId: (storeId) => `${ADMIN_STORE_PREFIX}/${storeId}`,
    update: (storeId) => `${ADMIN_STORE_PREFIX}/${storeId}`,
    updateStatus: (storeId) => `${ADMIN_STORE_PREFIX}/${storeId}/status`,
  },
}

export default storeEndpoints
