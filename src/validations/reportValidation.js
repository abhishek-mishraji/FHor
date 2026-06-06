const validateRequiredNumber = (value, label, errors, key) => {
  if (value === '' || value === null || value === undefined) {
    errors[key] = `${label} is required.`
  } else if (Number.isNaN(Number(value))) {
    errors[key] = `${label} must be a valid number.`
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

  validateRequiredNumber(values.reportMonth, 'Report month', errors, 'reportMonth')
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

  validateRequiredNumber(values.reportMonth, 'Report month', errors, 'reportMonth')
  validateRequiredNumber(values.reportYear, 'Report year', errors, 'reportYear')

  if (!values.file) {
    errors.file = 'Excel file is required.'
  } else {
    const expectedName = `monthly_${values.reportMonth}_${values.reportYear}.xlsx`

    if (!/\.xlsx$/i.test(values.file.name)) {
      errors.file = 'Only .xlsx Excel files are accepted.'
    } else if (values.reportMonth && values.reportYear && values.file.name !== expectedName) {
      errors.file = `Filename must match ${expectedName}.`
    }
  }

  return errors
}
