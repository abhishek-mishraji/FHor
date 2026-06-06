const ADMIN_CLIENT_PREFIX = '/api/v1/admin/clients'
const CLIENT_PREFIX = '/api/v1/client'

const clientEndpoints = {
  admin: {
    list: ADMIN_CLIENT_PREFIX,
    create: ADMIN_CLIENT_PREFIX,
    update: (clientId) => `${ADMIN_CLIENT_PREFIX}/${clientId}`,
  },
  client: {
    stores: `${CLIENT_PREFIX}/stores`,
  },
}

export default clientEndpoints
