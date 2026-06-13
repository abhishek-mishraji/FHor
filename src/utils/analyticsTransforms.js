import { GROUP_BY, GROUP_BY_LABELS } from '../constants/analyticsConstants'
import { formatDate, getMonthOptions } from './dateUtils'
import { formatNumber } from './numberUtils'

const monthOptions = getMonthOptions()

export const formatGroupLabel = (label, groupBy) => {
  if (groupBy === GROUP_BY.MONTH) {
    return monthOptions.find((option) => option.value === Number(label))?.label || label
  }

  if (groupBy === GROUP_BY.DATE) {
    return formatDate(label)
  }

  return String(label)
}

export const buildChartRows = (analytics, groupBy) => {
  if (!analytics?.labels?.length) {
    return []
  }

  return analytics.labels.map((label, index) =>
    (analytics.datasets || []).reduce(
      (row, dataset) => ({
        ...row,
        [dataset.metric]: dataset.data?.[index] ?? null,
      }),
      { label: formatGroupLabel(label, groupBy) },
    ),
  )
}

export const buildTableColumns = (analytics, groupBy, hiddenMetrics = []) => {
  if (!analytics?.datasets) {
    return []
  }

  return [
    { key: 'label', header: GROUP_BY_LABELS[groupBy] || 'Label' },
    ...analytics.datasets
      .filter((dataset) => !hiddenMetrics.includes(dataset.metric))
      .map((dataset) => ({
        key: dataset.metric,
        header: dataset.label,
        render: (row) => formatNumber(row[dataset.metric]),
      })),
  ]
}

export const buildKpiSummaries = (analytics) =>
  (analytics?.datasets || []).map((dataset) => {
    const values = (dataset.data || []).map(Number).filter((value) => !Number.isNaN(value))

    if (!values.length) {
      return {
        metric: dataset.metric,
        label: dataset.label,
        total: null,
        average: null,
        min: null,
        max: null,
        growthPercent: null,
      }
    }

    const total = values.reduce((sum, value) => sum + value, 0)
    const firstValue = values[0]
    const lastValue = values[values.length - 1]

    return {
      metric: dataset.metric,
      label: dataset.label,
      total,
      average: total / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      growthPercent: firstValue === 0 ? null : ((lastValue - firstValue) / Math.abs(firstValue)) * 100,
    }
  })

// Export matrix honours column visibility: pass the same columns the table renders.
export const buildExportMatrix = (columns, rows) => ({
  headers: columns.map((column) => column.header),
  body: rows.map((row) => columns.map((column) => row[column.key] ?? '')),
})
