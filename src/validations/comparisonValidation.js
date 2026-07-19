import { COMPARISON_MODES } from '../constants/comparisonConstants'

const requireDateRange = (values, errors) => {
  if (!values.fromDate) {
    errors.fromDate = 'Select a start date'
  }
  if (!values.toDate) {
    errors.toDate = 'Select an end date'
  }
  if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
    errors.toDate = 'End date must be on or after the start date'
  }
}

export const validateComparisonForm = (values) => {
  const errors = {}

  if (!values.storeId) {
    errors.storeId = 'Select a store'
  }

  const isMetricMode =
    values.mode === COMPARISON_MODES.METRIC || values.mode === COMPARISON_MODES.DAILY_METRIC

  if (!isMetricMode && !values.metrics?.length) {
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
      if (!values.year) {
        errors.year = 'Select a year'
      }
      if (!values.month) {
        errors.month = 'Select a month'
      }
      if (!values.comparisonYear) {
        errors.comparisonYear = 'Select a comparison year'
      }
      if (!values.comparisonMonth) {
        errors.comparisonMonth = 'Select a comparison month'
      }
      break

    case COMPARISON_MODES.METRIC:
      if (!values.year) {
        errors.year = 'Select a year'
      }
      if (!values.month) {
        errors.month = 'Select a month'
      }
      break

    case COMPARISON_MODES.DAY_OVER_DAY:
      requireDateRange(values, errors)
      break

    case COMPARISON_MODES.ONE_DAY_VS_RANGE:
      requireDateRange(values, errors)
      if (!values.referenceDate) {
        errors.referenceDate = 'Select a reference day'
      }
      break

    case COMPARISON_MODES.SELECTED_DAYS: {
      requireDateRange(values, errors)
      const selectedDays = values.comparisonDates || []
      if (selectedDays.length < 2) {
        errors.comparisonDates = 'Select at least two days to compare sequentially'
      }
      break
    }

    case COMPARISON_MODES.DAILY_METRIC:
      if (!values.date) {
        errors.date = 'Select a day'
      }
      break

    default:
      errors.mode = 'Select a comparison type'
  }

  return errors
}
