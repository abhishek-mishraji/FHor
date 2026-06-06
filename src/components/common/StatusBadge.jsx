import { memo } from 'react'

const normalizeVariant = (value = '') => {
  const normalizedValue = value.toLowerCase()

  if (normalizedValue.includes('active') || normalizedValue.includes('owner')) {
    return 'success'
  }

  if (normalizedValue.includes('inactive')) {
    return 'muted'
  }

  if (normalizedValue.includes('partner')) {
    return 'warning'
  }

  if (normalizedValue.includes('admin')) {
    return 'accent'
  }

  return 'info'
}

const StatusBadge = memo(function StatusBadge({ value }) {
  return <span className={`status-badge status-badge--${normalizeVariant(value)}`}>{value}</span>
})

export default StatusBadge
