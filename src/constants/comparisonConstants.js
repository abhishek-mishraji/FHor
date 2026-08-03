export const REPORT_TYPES = {
  MONTHLY: 'MONTHLY',
  DAILY: 'DAILY',
}

export const REPORT_TYPE_OPTIONS = [
  { value: REPORT_TYPES.MONTHLY, label: 'Monthly Reports' },
  { value: REPORT_TYPES.DAILY, label: 'Daily Reports' },
]

export const COMPARISON_MODES = {
  MONTH_OVER_MONTH: 'MONTH_OVER_MONTH',
  ONE_VS_MANY: 'ONE_VS_MANY',
  SELECTED_MONTHS: 'SELECTED_MONTHS',
  YEAR_OVER_YEAR: 'YEAR_OVER_YEAR',
  DEPARTMENT: 'DEPARTMENT',
  METRIC: 'METRIC',
  DAY_OVER_DAY: 'DAY_OVER_DAY',
  ONE_DAY_VS_RANGE: 'ONE_DAY_VS_RANGE',
  SELECTED_DAYS: 'SELECTED_DAYS',
  DAILY_METRIC: 'DAILY_METRIC',
}

// Daily reports only support groupBy=DATE (plus STORE) in the API, so the
// daily modes are the date-based mirrors of the monthly ones. Department and
// Year-over-Year have no daily equivalent (the API rejects those groupings).
export const COMPARISON_MODE_OPTIONS = [
  // {
  //   value: COMPARISON_MODES.MONTH_OVER_MONTH,
  //   reportType: REPORT_TYPES.MONTHLY,
  //   label: 'Month over Month (Sequential)',
  //   description:
  //     'Each month of the selected year is compared with its previous month. Example: Feb vs Jan, Mar vs Feb.',
  // },
  // {
  //   value: COMPARISON_MODES.ONE_VS_MANY,
  //   reportType: REPORT_TYPES.MONTHLY,
  //   label: 'One Month vs Many Months',
  //   description:
  //     'Pick a reference month and compare every selected month against it.',
  // },
  {
    value: COMPARISON_MODES.SELECTED_MONTHS,
    reportType: REPORT_TYPES.MONTHLY,
    label: 'Selected Months (Sequential)',
    description:
      'Compare a custom set of months sequentially — each selected month vs the previously selected one.',
  },
  {
    value: COMPARISON_MODES.YEAR_OVER_YEAR,
    reportType: REPORT_TYPES.MONTHLY,
    label: 'Year over Year',
    description:
      'Compare the same month across different years. Example: June 2024 vs June 2025 vs June 2026.',
  },
  {
    value: COMPARISON_MODES.DEPARTMENT,
    reportType: REPORT_TYPES.MONTHLY,
    label: 'Department Comparison',
    description:
      'Compare all departments between any selected month/year and any other selected month/year.',
  },
  {
    value: COMPARISON_MODES.METRIC,
    reportType: REPORT_TYPES.MONTHLY,
    label: 'Metric Comparison (Within a Month)',
    description:
      'Compare all metrics of a selected month against the previous month.',
  },
  {
    value: COMPARISON_MODES.DAY_OVER_DAY,
    reportType: REPORT_TYPES.DAILY,
    label: 'Day over Day (Sequential)',
    description:
      'Each day in the selected date range is compared with the previous reported day. Example: Jun 2 vs Jun 1, Jun 3 vs Jun 2.',
  },
  {
    value: COMPARISON_MODES.ONE_DAY_VS_RANGE,
    reportType: REPORT_TYPES.DAILY,
    label: 'One Day vs Many Days',
    description:
      'Pick a reference day and compare every day in the selected date range against it.',
  },
  {
    value: COMPARISON_MODES.SELECTED_DAYS,
    reportType: REPORT_TYPES.DAILY,
    label: 'Selected Days (Sequential)',
    description:
      'Pick a date range, choose specific days inside it, and compare each chosen day with the previously chosen one.',
  },
  {
    value: COMPARISON_MODES.DAILY_METRIC,
    reportType: REPORT_TYPES.DAILY,
    label: 'Metric Comparison (Within a Day)',
    description:
      'Compare all daily metrics of a selected day against the previous day.',
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

export const DAILY_METRICS = [
  { key: 'groceryTotal', label: 'Grocery Total' },
  { key: 'volume', label: 'Volume' },
  { key: 'cashDeposit', label: 'Cash Deposit' },
  { key: 'checkDeposit', label: 'Check Deposit' },
  { key: 'overShort', label: 'Over/Short' },
  { key: 'noSale', label: 'No Sale' },
  { key: 'lineVoid', label: 'Line Void' },
  { key: 'voidAmount', label: 'Void Amount' },
  { key: 'refunds', label: 'Refunds' },
]

export const METRIC_LABELS = Object.fromEntries(
  [...MONTHLY_METRICS, ...DAILY_METRICS].map((metric) => [metric.key, metric.label]),
)

export const ALL_METRIC_KEYS = MONTHLY_METRICS.map((metric) => metric.key)

export const ALL_DAILY_METRIC_KEYS = DAILY_METRICS.map((metric) => metric.key)

// Count metrics are plain quantities (transactions, occurrences) — formatted
// as numbers, not currency.
export const COUNT_METRICS = new Set(['volume', 'noSale', 'lineVoid'])

// gain: an increase is good (green). cost: an increase is bad (red).
// Promotion is a deduction from gross, so it is treated as a cost metric.
// Daily: over/short variance, no-sales, voids, and refunds growing is bad.
export const METRIC_POLARITY = {
  gross: 'gain',
  netSales: 'gain',
  discount: 'cost',
  promotion: 'cost',
  refund: 'cost',
  voidAmount: 'cost',
  groceryTotal: 'gain',
  volume: 'gain',
  cashDeposit: 'gain',
  checkDeposit: 'gain',
  overShort: 'cost',
  noSale: 'cost',
  lineVoid: 'cost',
  refunds: 'cost',
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
    comparisonYear: true,
    comparisonMonth: true,
    metrics: true,
  },
  [COMPARISON_MODES.METRIC]: {
    year: true,
    month: true,
    department: true,
  },
  [COMPARISON_MODES.DAY_OVER_DAY]: {
    fromDate: true,
    toDate: true,
    metrics: true,
  },
  [COMPARISON_MODES.ONE_DAY_VS_RANGE]: {
    referenceDate: true,
    fromDate: true,
    toDate: true,
    metrics: true,
  },
  [COMPARISON_MODES.SELECTED_DAYS]: {
    fromDate: true,
    toDate: true,
    comparisonDates: true,
    metrics: true,
  },
  [COMPARISON_MODES.DAILY_METRIC]: {
    date: true,
  },
}

export const DEFAULT_MODE_BY_REPORT_TYPE = {
  [REPORT_TYPES.MONTHLY]: COMPARISON_MODES.MONTH_OVER_MONTH,
  [REPORT_TYPES.DAILY]: COMPARISON_MODES.DAY_OVER_DAY,
}

export const DEFAULT_METRICS_BY_REPORT_TYPE = {
  [REPORT_TYPES.MONTHLY]: ['netSales'],
  [REPORT_TYPES.DAILY]: ['groceryTotal'],
}

export const buildDefaultFilters = () => {
  const now = new Date()
  const previousMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  return {
    reportType: REPORT_TYPES.MONTHLY,
    mode: COMPARISON_MODES.MONTH_OVER_MONTH,
    storeId: '',
    year: now.getFullYear(),
    years: [now.getFullYear() - 1, now.getFullYear()],
    month: now.getMonth() + 1,
    comparisonYear: previousYear,
    comparisonMonth: previousMonth,
    referenceMonth: '',
    comparisonMonths: [],
    departmentId: '',
    fromDate: '',
    toDate: '',
    referenceDate: '',
    comparisonDates: [],
    date: '',
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
