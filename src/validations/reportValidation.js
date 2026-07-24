const validateRequiredNumber = (value, label, errors, key) => {
  if (value === '' || value === null || value === undefined) {
    errors[key] = `${label} is required.`
  } else if (Number.isNaN(Number(value))) {
    errors[key] = `${label} must be a valid number.`
  }
}

const validateReportMonth = (value, errors) => {
  validateRequiredNumber(value, 'Report month', errors, 'reportMonth')

  if (
    value !== '' &&
    value !== null &&
    value !== undefined &&
    !Number.isNaN(Number(value)) &&
    (Number(value) < 1 || Number(value) > 12)
  ) {
    errors.reportMonth = 'Report month must be between 1 and 12.'
  }
}

export const validateDailyReportForm = (values) => {
  const errors = {}

  if (!values.storeId) {
    errors.storeId = 'Store is required.'
  }

  if (!values.reportDate) {
    errors.reportDate = 'Report date is required.'
  }

  return errors
}

export const validateMonthlyReportForm = (values) => {
  const errors = {}

  if (!values.storeId) {
    errors.storeId = 'Store is required.'
  }

  validateReportMonth(values.reportMonth, errors)
  validateRequiredNumber(values.reportYear, 'Report year', errors, 'reportYear')

  return errors
}

export const validateYearlyReportForm = (values) => {
  const errors = {}

  if (!values.storeId) {
    errors.storeId = 'Store is required.'
  }

  validateRequiredNumber(values.reportYear, 'Report year', errors, 'reportYear')

  return errors
}

export const validateMonthlyUploadForm = (values) => {
  const errors = {}

  if (!values.storeId) {
    errors.storeId = 'Store is required.'
  }

  validateReportMonth(values.reportMonth, errors)
  validateRequiredNumber(values.reportYear, 'Report year', errors, 'reportYear')

  if (!values.file) {
    errors.file = 'Excel file is required.'
    return errors
  }

  const filenameMatch = /^monthly_(\d{1,2})_(\d{4})\.(xls|xlsx)$/i.exec(values.file.name)

  if (!filenameMatch) {
    errors.file = 'Filename must match monthly_<month>_<year>.xls or monthly_<month>_<year>.xlsx.'
    return errors
  }

  const filenameMonth = Number(filenameMatch[1])
  const filenameYear = Number(filenameMatch[2])

  if (filenameMonth < 1 || filenameMonth > 12) {
    errors.file = 'Filename month must be between 1 and 12.'
  } else if (
    values.reportMonth &&
    values.reportYear &&
    (filenameMonth !== Number(values.reportMonth) || filenameYear !== Number(values.reportYear))
  ) {
    errors.file = 'Filename month and year must match the selected report month and year.'
  }

  return errors
}