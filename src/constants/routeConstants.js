import { ROLES } from './roleConstants'

export const ROUTES = {
  landing: '/',
  about: '/about',
  login: '/login',
  unauthorized: '/unauthorized',
  appRoot: '/app',
  dashboard: '/app/dashboard',
  analytics: '/app/analytics',
  clients: '/app/clients',
  stores: '/app/stores',
  storeMembers: '/app/store-members',
  dailyReports: '/app/reports/daily',
  monthlyReports: '/app/reports/monthly',
  gasReports: '/app/reports/gas',
  fuelTypes: '/app/fuel-types',
  lotteryReports: '/app/reports/lottery',
  yearlyReports: '/app/reports/yearly',
  profile: '/app/profile',
  notFound: '*',
}

export const DEFAULT_ROLE_HOME = {
  [ROLES.ADMIN]: ROUTES.dashboard,
  [ROLES.CLIENT]: ROUTES.dashboard,
}
