const ADMIN_GAS_PREFIX = '/api/v1/admin/gas-sales/monthly'
const CLIENT_GAS_PREFIX = '/api/v1/client/gas-sales/monthly'

const gasSalesEndpoints = {
  admin: {
    list: ADMIN_GAS_PREFIX,
    create: ADMIN_GAS_PREFIX,
    update: (id) => `${ADMIN_GAS_PREFIX}/${id}`,
    byId: (id) => `${ADMIN_GAS_PREFIX}/${id}`,
    details: (id) => `${ADMIN_GAS_PREFIX}/${id}`,
  },
  client: {
    list: CLIENT_GAS_PREFIX,
    create: CLIENT_GAS_PREFIX,
    update: (id) => `${CLIENT_GAS_PREFIX}/${id}`,
    byId: (id) => `${CLIENT_GAS_PREFIX}/${id}`,
  },
}

export default gasSalesEndpoints
