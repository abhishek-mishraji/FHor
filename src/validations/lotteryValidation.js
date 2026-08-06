import { validateMonthlyReportForm } from './reportValidation'

export const validateLotteryForm = (values) => {
  const errors = validateMonthlyReportForm(values)

  // required numeric fields for lottery
  const requiredNumeric = ['onlineSales', 'scratchOffSales', 'onlineCashes', 'scratchOffCashes', 'commission']

  requiredNumeric.forEach((key) => {
    const val = values[key]

    if (val === '' || val === null || val === undefined) {
      errors[key] = `${key} is required.`
    } else if (Number.isNaN(Number(val))) {
      errors[key] = `${key} must be a valid number.`
    }
  })

  return errors
}

export default validateLotteryForm
