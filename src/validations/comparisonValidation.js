import { COMPARISON_MODES } from '../constants/comparisonConstants'

export const validateComparisonForm = (values, { isAdmin } = {}) => {
  const errors = {}

  if (isAdmin && !values.storeId) {
    errors.storeId = 'Select a store'
  }

  if (values.mode !== COMPARISON_MODES.METRIC && !values.metrics?.length) {
    errors.metrics = 'Select at least one metric'
  }

  switch (values.mode) {
    case COMPARISON_MODES.MONTH_OVER_MONTH:
      if (!values.year) {
        errors.year = 'Select a year'
      }
      break

    case COMPARISON_MODES.ONE_VS_MANY: {
      if (!values.year) {
        errors.year = 'Select a year'
      }
      if (!values.referenceMonth) {
        errors.referenceMonth = 'Select a reference month'
      }
      const otherMonths = (values.comparisonMonths || []).filter(
        (month) => Number(month) !== Number(values.referenceMonth),
      )
      if (!otherMonths.length) {
        errors.comparisonMonths = 'Select at least one month to compare against the reference'
      }
      break
    }

    case COMPARISON_MODES.SELECTED_MONTHS:
      if (!values.year) {
        errors.year = 'Select a year'
      }
      if ((values.comparisonMonths || []).length < 2) {
        errors.comparisonMonths = 'Select at least two months to compare sequentially'
      }
      break

    case COMPARISON_MODES.YEAR_OVER_YEAR:
      if (!values.month) {
        errors.month = 'Select a month'
      }
      if ((values.years || []).length < 2) {
        errors.years = 'Select at least two years to compare'
      }
      break

    case COMPARISON_MODES.DEPARTMENT:
    case COMPARISON_MODES.METRIC:
      if (!values.year) {
        errors.year = 'Select a year'
      }
      if (!values.month) {
        errors.month = 'Select a month'
      }
      break

    default:
      errors.mode = 'Select a comparison type'
  }

  return errors
}
