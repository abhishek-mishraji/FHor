const ADMIN_LOTTERY_PREFIX = '/api/v1/admin/lottery-sales/monthly'
const CLIENT_LOTTERY_PREFIX = '/api/v1/client/lottery-sales/monthly'

const lotteryEndpoints = {
  admin: {
    list: ADMIN_LOTTERY_PREFIX,
    create: ADMIN_LOTTERY_PREFIX,
    update: (id) => `${ADMIN_LOTTERY_PREFIX}/${id}`,
    byId: (id) => `${ADMIN_LOTTERY_PREFIX}/${id}`,
  },
  client: {
    list: CLIENT_LOTTERY_PREFIX,
    create: CLIENT_LOTTERY_PREFIX,
    update: (id) => `${CLIENT_LOTTERY_PREFIX}/${id}`,
    byId: (id) => `${CLIENT_LOTTERY_PREFIX}/${id}`,
  },
}

export default lotteryEndpoints
