export const REPORT_TYPES = {
  DAILY: 'DAILY',
  MONTHLY: 'MONTHLY',
}

export const GROUP_BY = {
  DATE: 'DATE',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
  STORE: 'STORE',
  DEPARTMENT: 'DEPARTMENT',
}

export const AGGREGATES = {
  SUM: 'SUM',
  AVG: 'AVG',
  MIN: 'MIN',
  MAX: 'MAX',
}

export const CHART_TYPES = {
  LINE: 'LINE',
  AREA: 'AREA',
  BAR: 'BAR',
  HORIZONTAL_BAR: 'HORIZONTAL_BAR',
  PIE: 'PIE',
  DONUT: 'DONUT',
  GROUPED_BAR: 'GROUPED_BAR',
  STACKED_BAR: 'STACKED_BAR',
  MULTI_LINE: 'MULTI_LINE',
  COMPOSED: 'COMPOSED',
}

export const VIEW_MODES = {
  FULL: 'FULL',
  CHART: 'CHART',
  TABLE: 'TABLE',
  SPLIT: 'SPLIT',
}

export const ADMIN_SCOPES = {
  STORES: 'STORES',
  CLIENT: 'CLIENT',
}

export const REPORT_TYPE_OPTIONS = [
  { label: 'Daily', value: REPORT_TYPES.DAILY },
  { label: 'Monthly', value: REPORT_TYPES.MONTHLY },
]

export const AGGREGATE_OPTIONS = [
  { label: 'Sum', value: AGGREGATES.SUM },
  { label: 'Average', value: AGGREGATES.AVG },
  { label: 'Minimum', value: AGGREGATES.MIN },
  { label: 'Maximum', value: AGGREGATES.MAX },
]

export const GROUP_BY_LABELS = {
  [GROUP_BY.DATE]: 'Date',
  [GROUP_BY.MONTH]: 'Month',
  [GROUP_BY.YEAR]: 'Year',
  [GROUP_BY.STORE]: 'Store',
  [GROUP_BY.DEPARTMENT]: 'Department',
}

export const GROUP_BY_BY_REPORT_TYPE = {
  [REPORT_TYPES.DAILY]: [GROUP_BY.DATE, GROUP_BY.STORE],
  [REPORT_TYPES.MONTHLY]: [GROUP_BY.MONTH, GROUP_BY.YEAR, GROUP_BY.STORE, GROUP_BY.DEPARTMENT],
}

export const METRICS_BY_REPORT_TYPE = {
  [REPORT_TYPES.DAILY]: [
    { value: 'groceryTotal', label: 'Grocery Total' },
    { value: 'volume', label: 'Volume' },
    { value: 'cashDeposit', label: 'Cash Deposit' },
    { value: 'checkDeposit', label: 'Check Deposit' },
    { value: 'overShort', label: 'Over / Short' },
    { value: 'noSale', label: 'No Sale' },
    { value: 'lineVoid', label: 'Line Void' },
    { value: 'voidAmount', label: 'Void Amount' },
    { value: 'refunds', label: 'Refunds' },
  ],
  [REPORT_TYPES.MONTHLY]: [
    { value: 'gross', label: 'Gross' },
    { value: 'netSales', label: 'Net Sales' },
    { value: 'discount', label: 'Discount' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'refund', label: 'Refund' },
    { value: 'voidAmount', label: 'Void Amount' },
  ],
}

export const CHART_TYPE_OPTIONS = [
  { label: 'Line', value: CHART_TYPES.LINE },
  { label: 'Area', value: CHART_TYPES.AREA },
  { label: 'Bar', value: CHART_TYPES.BAR },
  { label: 'Horizontal Bar', value: CHART_TYPES.HORIZONTAL_BAR },
  { label: 'Pie', value: CHART_TYPES.PIE },
  { label: 'Donut', value: CHART_TYPES.DONUT },
  { label: 'Grouped Bar', value: CHART_TYPES.GROUPED_BAR },
  { label: 'Stacked Bar', value: CHART_TYPES.STACKED_BAR },
  { label: 'Multi Line', value: CHART_TYPES.MULTI_LINE },
  { label: 'Composed', value: CHART_TYPES.COMPOSED },
]

export const GROUP_BY_HINTS = {
  [GROUP_BY.DATE]: 'One value per day — best for spotting daily trends.',
  [GROUP_BY.MONTH]: 'One value per month — best for trends across the year.',
  [GROUP_BY.YEAR]: 'One value per year — best for year vs year comparison.',
  [GROUP_BY.STORE]: 'One value per store — best for comparing stores.',
  [GROUP_BY.DEPARTMENT]: 'One value per department — best for department share.',
}

export const CHART_SUGGESTIONS = {
  [GROUP_BY.DATE]: CHART_TYPES.LINE,
  [GROUP_BY.MONTH]: CHART_TYPES.LINE,
  [GROUP_BY.STORE]: CHART_TYPES.HORIZONTAL_BAR,
  [GROUP_BY.DEPARTMENT]: CHART_TYPES.DONUT,
  [GROUP_BY.YEAR]: CHART_TYPES.GROUPED_BAR,
}

export const VIEW_MODE_OPTIONS = [
  { label: 'KPI + Chart + Table', value: VIEW_MODES.FULL },
  { label: 'Chart Only', value: VIEW_MODES.CHART },
  { label: 'Table Only', value: VIEW_MODES.TABLE },
  { label: 'Split View', value: VIEW_MODES.SPLIT },
]

export const CHART_COLORS = [
  '#0f766e',
  '#2563eb',
  '#f59e0b',
  '#be123c',
  '#7c3aed',
  '#15803d',
  '#0891b2',
  '#b45309',
  '#db2777',
  '#475569',
]
