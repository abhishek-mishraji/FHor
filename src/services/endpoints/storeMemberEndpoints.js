const ADMIN_STORE_MEMBER_PREFIX = '/api/v1/admin/store-members'

const storeMemberEndpoints = {
  list: ADMIN_STORE_MEMBER_PREFIX,
  create: ADMIN_STORE_MEMBER_PREFIX,
  remove: (storeId, clientId) => `${ADMIN_STORE_MEMBER_PREFIX}/${storeId}/${clientId}`,
}

export default storeMemberEndpoints
