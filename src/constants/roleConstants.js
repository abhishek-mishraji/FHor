export const ROLES = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
}

export const STORE_ROLES = {
  OWNER: 'OWNER',
  PARTNER: 'PARTNER',
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.CLIENT]: 'Client',
}

export const STORE_ROLE_LABELS = {
  [STORE_ROLES.OWNER]: 'Owner',
  [STORE_ROLES.PARTNER]: 'Partner',
}

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    manageClients: true,
    manageStores: true,
    manageStoreMembers: true,
    editReports: true,
    uploadMonthlyReports: true,
    viewAllStores: true,
  },
  [ROLES.CLIENT]: {
    manageClients: false,
    manageStores: false,
    manageStoreMembers: false,
    editReports: false,
    uploadMonthlyReports: false,
    viewAllStores: false,
  },
}
