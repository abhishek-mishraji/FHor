import { validateMonthlyReportForm } from './reportValidation'

export const validateGasForm = (values) => {
  const errors = validateMonthlyReportForm(values)

  const nonNegativeFields = ['creditFees', 'totalVolumeSold']
  const signedFields = ['netProfit', 'netProfitPerGallon']
  const numericFields = [...nonNegativeFields, ...signedFields]

  numericFields.forEach((key) => {
    const val = values[key]
    const isNegative = nonNegativeFields.includes(key) && Number(val) < 0

    if (val !== '' && val !== null && val !== undefined && (Number.isNaN(Number(val)) || isNegative)) {
      errors[key] = `${key} must be a valid number.`
    }
  })

  if (!Array.isArray(values.details) || !values.details.length) {
    errors.details = 'Add supported fuel types before saving the report.'
    return errors
  }

  values.details.forEach((detail, idx) => {
    if (!detail.fuelTypeId) {
      errors[`details.${idx}.fuelTypeId`] = 'Fuel type is required.'
    }

    if (detail.volumeSold === undefined || detail.volumeSold === null || detail.volumeSold === '') {
      errors[`details.${idx}.volumeSold`] = 'Volume sold is required.'
    } else if (Number.isNaN(Number(detail.volumeSold)) || Number(detail.volumeSold) < 0) {
      errors[`details.${idx}.volumeSold`] = 'Volume sold must be zero or greater.'
    }

    if (detail.profitPerGallon === undefined || detail.profitPerGallon === null || detail.profitPerGallon === '') {
      errors[`details.${idx}.profitPerGallon`] = 'Profit per gallon is required.'
    } else if (Number.isNaN(Number(detail.profitPerGallon))) {
      errors[`details.${idx}.profitPerGallon`] = 'Profit per gallon must be a valid number.'
    }
  })

  return errors
}

export default validateGasForm
