const normalizeCurrencyCode = (currency) =>
  typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency : 'USD'

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
    currency: normalizeCurrencyCode(currency),
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

// Always-signed currency for comparison deltas: +$15,240.50 / -$5,120.80.
// Zero is rendered unsigned ($0.00); non-numeric input renders a dash.
export const formatSignedCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '-'
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizeCurrencyCode(currency),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return amount > 0 ? `+${formatted}` : amount < 0 ? `-${formatted}` : formatted
}

// Always-signed plain number for count-metric deltas: +12 / -5. Zero is
// rendered unsigned; non-numeric input renders a dash.
export const formatSignedNumber = (value, maximumFractionDigits = 2) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '-'
  }

  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(Math.abs(amount))

  return amount > 0 ? `+${formatted}` : amount < 0 ? `-${formatted}` : formatted
}

// Signed percentage with two decimals: +15.23% / -4.82% / 0.00%.
export const formatSignedPercent = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const amount = Number(value)

  if (Number.isNaN(amount)) {
    return '-'
  }

  const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''

  return `${sign}${Math.abs(amount).toFixed(2)}%`
}

export const parseNumericInput = (value) => {
  if (value === '' || value === null || value === undefined) {
    return ''
  }

  const parsedValue = Number(value)

  return Number.isNaN(parsedValue) ? value : parsedValue
}
