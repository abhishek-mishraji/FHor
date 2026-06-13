import {
  ADMIN_SCOPES,
  GROUP_BY,
  GROUP_BY_BY_REPORT_TYPE,
  METRICS_BY_REPORT_TYPE,
  REPORT_TYPES,
} from '../constants/analyticsConstants'

export const validateAnalyticsForm = (values, { isAdmin } = {}) => {
  const errors = {}
  const { reportType, groupBy, metrics = [] } = values

  if (!reportType) {
    errors.reportType = 'Report type is required.'
  }

  if (!groupBy) {
    errors.groupBy = 'Group by is required.'
  } else if (reportType && !GROUP_BY_BY_REPORT_TYPE[reportType]?.includes(groupBy)) {
    errors.groupBy = `Group by ${groupBy} is not valid for ${reportType} reports.`
  }

  if (!metrics.length) {
    errors.metrics = 'Select at least one metric.'
  } else if (reportType) {
    const validMetrics = METRICS_BY_REPORT_TYPE[reportType]?.map((metric) => metric.value) || []
    const invalidMetric = metrics.find((metric) => !validMetrics.includes(metric))

    if (invalidMetric) {
      errors.metrics = `Metric '${invalidMetric}' is not valid for ${reportType} reports.`
    }
  }

  if (isAdmin) {
    if (values.scope === ADMIN_SCOPES.STORES && !values.storeIds?.length) {
      errors.storeIds = 'Select at least one store.'
    }

    if (values.scope === ADMIN_SCOPES.CLIENT && !values.clientId) {
      errors.clientId = 'Select a client.'
    }
  }

  if (reportType === REPORT_TYPES.DAILY && values.from && values.to && values.from > values.to) {
    errors.from = 'From date must be before to date.'
  }

  if (groupBy === GROUP_BY.MONTH && !values.years?.length) {
    errors.years = 'Select at least one year when grouping by month.'
  }

  if (groupBy === GROUP_BY.YEAR && !values.years?.length) {
    errors.years = 'At least one year is required when grouping by year.'
  }

  if (groupBy === GROUP_BY.DEPARTMENT) {
    if (!values.years?.length) {
      errors.years = 'Year is required when grouping by department.'
    }

    if (isAdmin && values.scope !== ADMIN_SCOPES.STORES) {
      errors.storeIds = 'Department grouping requires explicit store selection.'
    }
  }

  if (values.months?.some((month) => Number(month) < 1 || Number(month) > 12)) {
    errors.months = 'Months must be between 1 and 12.'
  }

  return errors
}
