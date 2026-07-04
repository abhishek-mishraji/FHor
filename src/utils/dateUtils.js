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

// Parses a date-only ISO string ("2026-06-05") as a LOCAL date. new Date(iso)
// would parse it as UTC midnight and shift a day in negative-offset timezones.
export const parseIsoDate = (iso) => {
  const [year, month, day] = String(iso).split('-').map(Number)

  return new Date(year, month - 1, day)
}

export const toIsoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const formatIsoDate = (iso, locale = 'en-US') => {
  if (!iso) {
    return 'N/A'
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(parseIsoDate(iso))
  } catch {
    return iso
  }
}

export const previousDayOf = (iso) => {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() - 1)

  return toIsoDate(date)
}

// Every day between from and to (inclusive) as select options, capped so a
// mistyped range can't render thousands of entries.
export const getDayOptions = (from, to, maxDays = 366) => {
  if (!from || !to || from > to) {
    return []
  }

  const options = []
  const cursor = parseIsoDate(from)
  const end = parseIsoDate(to)

  while (cursor <= end && options.length < maxDays) {
    const iso = toIsoDate(cursor)
    options.push({ value: iso, label: formatIsoDate(iso) })
    cursor.setDate(cursor.getDate() + 1)
  }

  return options
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
