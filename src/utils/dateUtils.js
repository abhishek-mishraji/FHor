export const formatDate = (value, locale = 'en-US') => {
  if (!value) {
    return 'N/A'
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export const formatDateTime = (value, locale = 'en-US') => {
  if (!value) {
    return 'N/A'
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export const toInputDate = (value) => {
  if (!value) {
    return ''
  }

  return String(value).slice(0, 10)
}

export const getMonthOptions = () =>
  Array.from({ length: 12 }, (_, index) => ({
    label: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
      new Date(2026, index, 1),
    ),
    value: index + 1,
  }))

export const getYearOptions = (centerYear = new Date().getFullYear(), span = 5) =>
  Array.from({ length: span * 2 + 1 }, (_, index) => {
    const value = centerYear - span + index

    return {
      label: String(value),
      value,
    }
  })

export const formatMonthYear = (month, year) => {
  if (!month || !year) {
    return 'N/A'
  }

  const monthLabel = getMonthOptions().find((option) => option.value === Number(month))?.label

  return `${monthLabel || month}/${year}`
}
