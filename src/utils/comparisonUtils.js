import { COMPARISON_MODES, METRIC_POLARITY } from '../constants/comparisonConstants'
import { getMonthOptions } from './dateUtils'
import { formatCurrency, formatSignedCurrency, formatSignedPercent } from './numberUtils'

const monthOptions = getMonthOptions()

export const getMonthName = (month) =>
  monthOptions.find((option) => option.value === Number(month))?.label || String(month)

export const formatMonthTitle = (month, year) =>
  year ? `${getMonthName(month)} ${year}` : getMonthName(month)

export const computeDifference = (current, previous) =>
  current === null || current === undefined || previous === null || previous === undefined
    ? null
    : current - previous

// (Current - Previous) / Previous × 100 — null when it cannot be calculated,
// which the UI renders as "-".
export const computePctDifference = (current, previous) => {
  const difference = computeDifference(current, previous)

  if (difference === null || previous === 0) {
    return null
  }

  return (difference / previous) * 100
}

// Centralized color semantics: gain metrics color increases green, cost
// metrics (discount, promotion, refund, void) color increases red.
export const getDeltaTone = (metricKey, delta) => {
  if (delta === null || delta === undefined || delta === 0) {
    return null
  }

  const polarity = METRIC_POLARITY[metricKey] || 'gain'
  const isImprovement = polarity === 'gain' ? delta > 0 : delta < 0

  return isImprovement ? 'positive' : 'negative'
}

// The API labels months as "6" for a single requested year and "2026-06"
// when multiple years are requested.
export const parseMonthLabel = (label) => {
  const text = String(label)

  if (text.includes('-')) {
    const [year, month] = text.split('-')

    return { year: Number(year), month: Number(month) }
  }

  return { year: null, month: Number(text) }
}

export const previousMonthOf = (month, year) =>
  Number(month) === 1
    ? { month: 12, year: Number(year) - 1 }
    : { month: Number(month) - 1, year: Number(year) }

const summarizeValues = (values) => {
  if (!values.length) {
    return { sum: null, avg: null, min: null, max: null }
  }

  const sum = values.reduce((total, value) => total + value, 0)

  return {
    sum,
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

// Trend column style per mode: arrow glyphs for sequential comparisons,
// Better/Worse text for reference comparisons, none for Year over Year.
const STATUS_STYLE_BY_MODE = {
  [COMPARISON_MODES.MONTH_OVER_MONTH]: 'trend',
  [COMPARISON_MODES.SELECTED_MONTHS]: 'trend',
  [COMPARISON_MODES.METRIC]: 'trend',
  [COMPARISON_MODES.ONE_VS_MANY]: 'status',
  [COMPARISON_MODES.DEPARTMENT]: 'status',
  [COMPARISON_MODES.YEAR_OVER_YEAR]: null,
}

const formatValueCell = (value) =>
  value === null || value === undefined ? '-' : formatCurrency(value)

// Column groups visible after the ColumnSelector's per-metric filter.
// Non-metric groups (year columns, delta, value) are always visible.
export const getVisibleColumnGroups = (result, prefs) =>
  result.columnGroups.filter(
    (group) =>
      !group.metric || !prefs.visibleMetrics || prefs.visibleMetrics.includes(group.metric),
  )

// Builds the table column definitions for a comparison result. Multi-group
// results get a two-row grouped header; single-group results get flat
// headers like "Net Sales (Current)".
export const buildComparisonColumns = (result, prefs) => {
  const groups = getVisibleColumnGroups(result, prefs)
  const useGroupedHeader = groups.length > 1
  const statusStyle = STATUS_STYLE_BY_MODE[result.mode]

  const columns = [
    {
      key: 'label',
      header: result.rowDimension,
      sticky: true,
      align: 'left',
      sortable: true,
      width: 180,
      accessor: (row) => (row.sortValue !== undefined ? row.sortValue : row.label),
      render: (row) => row.label,
      cellTitle: (row) => (row.previousRef ? `Compared with ${row.previousRef}` : null),
    },
  ]

  groups.forEach((group) => {
    const cellOf = (row) => row.cells?.[group.key]
    const toneMetricOf = (row) => group.metric || row.toneMetric
    const groupTag = useGroupedHeader ? { key: group.key, label: group.label } : null
    const deltaTone = (row) => getDeltaTone(toneMetricOf(row), cellOf(row)?.difference)

    if (group.kind === 'single') {
      // Single-value columns (YoY year columns) render flat — a one-column
      // group header would just repeat the same label twice.
      columns.push({
        key: `${group.key}.current`,
        header: group.label,
        group: null,
        align: 'right',
        sortable: true,
        width: 140,
        accessor: (row) => cellOf(row)?.current ?? null,
        render: (row) => formatValueCell(cellOf(row)?.current),
      })
      return
    }

    const currentHeader = result.currentHeader || 'Current'
    const previousHeader = result.previousHeader || 'Previous'

    if (!group.deltaOnly) {
      columns.push({
        key: `${group.key}.current`,
        header: useGroupedHeader ? currentHeader : `${group.label} (${currentHeader})`,
        group: groupTag,
        align: 'right',
        sortable: true,
        width: 140,
        accessor: (row) => cellOf(row)?.current ?? null,
        render: (row) => formatValueCell(cellOf(row)?.current),
      })
    }

    if (result.mode === COMPARISON_MODES.METRIC) {
      columns.push({
        key: 'shareOfGross',
        header: '% of Gross',
        group: groupTag,
        align: 'right',
        sortable: true,
        width: 110,
        accessor: (row) => row.shareOfGross ?? null,
        render: (row) =>
          row.shareOfGross === null || row.shareOfGross === undefined
            ? '-'
            : `${row.shareOfGross.toFixed(2)}%`,
      })
    }

    if (!group.deltaOnly && prefs.showPrevious) {
      columns.push({
        key: `${group.key}.previous`,
        header: useGroupedHeader ? previousHeader : `${previousHeader} (${group.label})`,
        group: groupTag,
        align: 'right',
        sortable: true,
        width: 140,
        accessor: (row) => cellOf(row)?.previous ?? null,
        render: (row) => formatValueCell(cellOf(row)?.previous),
        cellTitle: (row) => (row.previousRef ? `From ${row.previousRef}` : null),
      })
    }

    if (prefs.showDifference) {
      columns.push({
        key: `${group.key}.difference`,
        header: 'Difference',
        group: groupTag,
        align: 'right',
        sortable: true,
        width: 130,
        accessor: (row) => cellOf(row)?.difference ?? null,
        render: (row) => formatSignedCurrency(cellOf(row)?.difference),
        tone: deltaTone,
      })
    }

    if (prefs.showPct) {
      columns.push({
        key: `${group.key}.pctDifference`,
        header: '% Difference',
        group: groupTag,
        align: 'right',
        sortable: true,
        width: 120,
        accessor: (row) => cellOf(row)?.pctDifference ?? null,
        render: (row) => formatSignedPercent(cellOf(row)?.pctDifference),
        tone: deltaTone,
      })
    }

    if (statusStyle) {
      columns.push({
        key: `${group.key}.trend`,
        header: statusStyle === 'trend' ? 'Trend' : 'Better / Worse',
        group: groupTag,
        align: 'center',
        sortable: false,
        width: statusStyle === 'trend' ? 80 : 120,
        accessor: (row) => cellOf(row)?.difference ?? null,
        render: (row) => {
          const difference = cellOf(row)?.difference
          const tone = deltaTone(row)

          if (statusStyle === 'trend') {
            return tone === 'positive' ? '▲' : tone === 'negative' ? '▼' : '—'
          }
          if (difference === 0) {
            return 'Same'
          }

          return tone === 'positive' ? 'Better' : tone === 'negative' ? 'Worse' : '—'
        },
        tone: deltaTone,
      })
    }
  })

  return columns
}

// SUM/AVG/MIN/MAX of a cell group's current and previous columns across rows.
export const computeSummary = (rows, groupKey) => {
  const collect = (field) =>
    rows
      .map((row) => row.cells?.[groupKey]?.[field])
      .filter((value) => typeof value === 'number' && !Number.isNaN(value))

  return {
    current: summarizeValues(collect('current')),
    previous: summarizeValues(collect('previous')),
  }
}
