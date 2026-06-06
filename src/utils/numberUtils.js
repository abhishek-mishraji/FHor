export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return value
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (value, maximumFractionDigits = 2) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return value
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(amount)
}

export const parseNumericInput = (value) => {
  if (value === '' || value === null || value === undefined) {
    return ''
  }

  const parsedValue = Number(value)

  return Number.isNaN(parsedValue) ? value : parsedValue
}
