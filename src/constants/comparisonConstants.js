export const COMPARISON_MODES = {
  MONTH_OVER_MONTH: 'MONTH_OVER_MONTH',
  ONE_VS_MANY: 'ONE_VS_MANY',
  SELECTED_MONTHS: 'SELECTED_MONTHS',
  YEAR_OVER_YEAR: 'YEAR_OVER_YEAR',
  DEPARTMENT: 'DEPARTMENT',
  METRIC: 'METRIC',
}

export const COMPARISON_MODE_OPTIONS = [
  {
    value: COMPARISON_MODES.MONTH_OVER_MONTH,
    label: 'Month over Month (Sequential)',
    description:
      'Each month of the selected year is compared with its previous month. Example: Feb vs Jan, Mar vs Feb.',
  },
  {
    value: COMPARISON_MODES.ONE_VS_MANY,
    label: 'One Month vs Many Months',
    description:
      'Pick a reference month and compare every selected month against it.',
  },
  {
    value: COMPARISON_MODES.SELECTED_MONTHS,
    label: 'Selected Months (Sequential)',
    description:
      'Compare a custom set of months sequentially — each selected month vs the previously selected one.',
  },
  {
    value: COMPARISON_MODES.YEAR_OVER_YEAR,
    label: 'Year over Year',
    description:
      'Compare the same month across different years. Example: June 2024 vs June 2025 vs June 2026.',
  },
  {
    value: COMPARISON_MODES.DEPARTMENT,
    label: 'Department Comparison (In a Month)',
    description:
      'Compare all departments in a selected month against the previous month.',
  },
  {
    value: COMPARISON_MODES.METRIC,
    label: 'Metric Comparison (Within a Month)',
    description:
      'Compare all metrics of a selected month against the previous month.',
  },
]

export const MONTHLY_METRICS = [
  { key: 'gross', label: 'Gross' },
  { key: 'netSales', label: 'Net Sales' },
  { key: 'discount', label: 'Discount' },
  { key: 'promotion', label: 'Promotion' },
  { key: 'refund', label: 'Refund' },
  { key: 'voidAmount', label: 'Void Amount' },
]

export const METRIC_LABELS = Object.fromEntries(
  MONTHLY_METRICS.map((metric) => [metric.key, metric.label]),
)

export const ALL_METRIC_KEYS = MONTHLY_METRICS.map((metric) => metric.key)

// gain: an increase is good (green). cost: an increase is bad (red).
// Promotion is a deduction from gross, so it is treated as a cost metric.
export const METRIC_POLARITY = {
  gross: 'gain',
  netSales: 'gain',
  discount: 'cost',
  promotion: 'cost',
  refund: 'cost',
  voidAmount: 'cost',
}

export const AGGREGATES = {
  SUM: 'SUM',
  AVG: 'AVG',
  MIN: 'MIN',
  MAX: 'MAX',
}

export const AGGREGATE_OPTIONS = [
  { value: AGGREGATES.SUM, label: 'Sum' },
  { value: AGGREGATES.AVG, label: 'Average' },
  { value: AGGREGATES.MIN, label: 'Minimum' },
  { value: AGGREGATES.MAX, label: 'Maximum' },
]

// Which toolbar fields each comparison mode needs. Fields not listed are hidden.
export const MODE_FIELD_CONFIG = {
  [COMPARISON_MODES.MONTH_OVER_MONTH]: {
    year: true,
    department: true,
    metrics: true,
  },
  [COMPARISON_MODES.ONE_VS_MANY]: {
    year: true,
    referenceMonth: true,
    comparisonMonths: true,
    department: true,
    metrics: true,
  },
  [COMPARISON_MODES.SELECTED_MONTHS]: {
    year: true,
    comparisonMonths: true,
    department: true,
    metrics: true,
  },
  [COMPARISON_MODES.YEAR_OVER_YEAR]: {
    years: true,
    month: true,
    department: true,
    metrics: true,
  },
  [COMPARISON_MODES.DEPARTMENT]: {
    year: true,
    month: true,
    metrics: true,
  },
  [COMPARISON_MODES.METRIC]: {
    year: true,
    month: true,
    department: true,
  },
}

export const buildDefaultFilters = () => {
  const now = new Date()

  return {
    mode: COMPARISON_MODES.MONTH_OVER_MONTH,
    storeId: '',
    year: now.getFullYear(),
    years: [now.getFullYear() - 1, now.getFullYear()],
    month: now.getMonth() + 1,
    referenceMonth: '',
    comparisonMonths: [],
    departmentId: '',
    metrics: ['netSales'],
    aggregate: AGGREGATES.SUM,
  }
}

export const DEFAULT_COLUMN_PREFS = {
  showPrevious: true,
  showDifference: true,
  showPct: true,
  // null = every metric selected in the toolbar is visible
  visibleMetrics: null,
}
