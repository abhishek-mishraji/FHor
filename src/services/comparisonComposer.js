import {
  ALL_DAILY_METRIC_KEYS,
  ALL_METRIC_KEYS,
  COMPARISON_MODES,
  METRIC_LABELS,
} from '../constants/comparisonConstants'
import {
  computeDifference,
  computePctDifference,
  formatMonthTitle,
  getMonthName,
  parseMonthLabel,
  previousMonthOf,
} from '../utils/comparisonUtils'
import { formatIsoDate, previousDayOf } from '../utils/dateUtils'

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isNaN(parsed) ? null : parsed
}

// Both roles scope by the selected store. The client endpoint still resolves
// allowed stores from the JWT server-side, so a client's storeIds can only
// narrow within their own stores.
const buildParams = (values, isAdmin, metrics, extra = {}, { includeDepartment = true } = {}) => ({
  reportType: 'MONTHLY',
  aggregate: values.aggregate || 'SUM',
  metric: metrics,
  ...(values.storeId ? { storeIds: [values.storeId] } : {}),
  ...(includeDepartment && values.departmentId ? { departmentId: values.departmentId } : {}),
  ...extra,
})

const indexResponse = (response) => ({
  labels: response?.labels || [],
  byMetric: new Map((response?.datasets || []).map((dataset) => [dataset.metric, dataset.data || []])),
})

// Normalize a groupBy=MONTH response into chronologically sorted buckets:
// [{ month, year, values: { metricKey: number|null } }]
const buildMonthBuckets = (response, fallbackYear) => {
  const { labels, byMetric } = indexResponse(response)

  return labels
    .map((label, index) => {
      const { month, year } = parseMonthLabel(label)

      return {
        month,
        year: year ?? Number(fallbackYear),
        values: Object.fromEntries(
          [...byMetric].map(([metric, data]) => [metric, toNumber(data[index])]),
        ),
      }
    })
    .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
}

const buildCells = (metrics, currentValues = {}, previousValues = {}) =>
  Object.fromEntries(
    metrics.map((metric) => {
      const current = currentValues?.[metric] ?? null
      const previous = previousValues?.[metric] ?? null

      return [
        metric,
        {
          current,
          previous,
          difference: computeDifference(current, previous),
          pctDifference: computePctDifference(current, previous),
        },
      ]
    }),
  )

// `metric` marks groups the ColumnSelector can hide per-metric.
const metricColumnGroups = (metrics) =>
  metrics.map((metric) => ({
    key: metric,
    label: METRIC_LABELS[metric] || metric,
    kind: 'delta',
    metric,
  }))

const composeMonthOverMonth = async (values, fetcher, isAdmin) => {
  const metrics = values.metrics
  const response = await fetcher(
    buildParams(values, isAdmin, metrics, { groupBy: 'MONTH', year: [values.year] }),
  )
  const buckets = buildMonthBuckets(response, values.year)

  return {
    mode: values.mode,
    rowDimension: 'Month',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: 'Current',
    previousHeader: 'Previous',
    summaryEnabled: true,
    title: `Month over Month — ${values.year}`,
    rows: buckets.map((bucket, index) => {
      const previousBucket = buckets[index - 1] || null

      return {
        id: `${bucket.year}-${bucket.month}`,
        label: getMonthName(bucket.month),
        previousRef: previousBucket ? getMonthName(previousBucket.month) : null,
        toneMetric: null,
        cells: buildCells(metrics, bucket.values, previousBucket?.values),
      }
    }),
  }
}

const composeOneVsMany = async (values, fetcher, isAdmin) => {
  const metrics = values.metrics
  const referenceMonth = Number(values.referenceMonth)
  const response = await fetcher(
    buildParams(values, isAdmin, metrics, { groupBy: 'MONTH', year: [values.year] }),
  )
  const buckets = buildMonthBuckets(response, values.year)
  const bucketByMonth = new Map(buckets.map((bucket) => [bucket.month, bucket]))
  const referenceValues = bucketByMonth.get(referenceMonth)?.values

  const months = (values.comparisonMonths || [])
    .map(Number)
    .filter((month) => month !== referenceMonth)
    .sort((a, b) => a - b)

  return {
    mode: values.mode,
    rowDimension: 'Month',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: 'Current',
    previousHeader: `Reference (${getMonthName(referenceMonth)})`,
    summaryEnabled: true,
    title: `Months vs ${formatMonthTitle(referenceMonth, values.year)}`,
    rows: months.map((month) => ({
      id: `${values.year}-${month}`,
      label: getMonthName(month),
      previousRef: getMonthName(referenceMonth),
      toneMetric: null,
      cells: buildCells(metrics, bucketByMonth.get(month)?.values, referenceValues),
    })),
  }
}

const composeSelectedMonths = async (values, fetcher, isAdmin) => {
  const metrics = values.metrics
  const response = await fetcher(
    buildParams(values, isAdmin, metrics, { groupBy: 'MONTH', year: [values.year] }),
  )
  const buckets = buildMonthBuckets(response, values.year)
  const bucketByMonth = new Map(buckets.map((bucket) => [bucket.month, bucket]))
  const months = (values.comparisonMonths || []).map(Number).sort((a, b) => a - b)

  return {
    mode: values.mode,
    rowDimension: 'Month',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: 'Current',
    previousHeader: 'Compared With',
    summaryEnabled: true,
    title: `Selected Months (Sequential) — ${values.year}`,
    rows: months.map((month, index) => {
      const previousMonth = index > 0 ? months[index - 1] : null

      return {
        id: `${values.year}-${month}`,
        label: getMonthName(month),
        previousRef: previousMonth ? getMonthName(previousMonth) : null,
        toneMetric: null,
        cells: buildCells(
          metrics,
          bucketByMonth.get(month)?.values,
          previousMonth ? bucketByMonth.get(previousMonth)?.values : undefined,
        ),
      }
    }),
  }
}

// Mockup layout: one row per metric, one column per year, plus a delta
// column comparing the two most recent selected years.
const composeYearOverYear = async (values, fetcher, isAdmin) => {
  const metrics = values.metrics
  const years = (values.years || []).map(Number).sort((a, b) => a - b)
  const response = await fetcher(
    buildParams(values, isAdmin, metrics, {
      groupBy: 'YEAR',
      month: values.month,
      year: years,
    }),
  )
  const { labels, byMetric } = indexResponse(response)
  const yearIndex = new Map(labels.map((label, index) => [Number(label), index]))
  const [priorYear, latestYear] = years.slice(-2)

  return {
    mode: values.mode,
    rowDimension: 'Metric',
    columnGroups: [
      ...years.map((year) => ({
        key: String(year),
        label: formatMonthTitle(values.month, year),
        kind: 'single',
      })),
      { key: 'delta', label: `${latestYear} vs ${priorYear}`, kind: 'delta', deltaOnly: true },
    ],
    currentHeader: null,
    previousHeader: null,
    summaryEnabled: false,
    title: `Year over Year — ${getMonthName(values.month)} ${years.join(' vs ')}`,
    rows: metrics.map((metric) => {
      const data = byMetric.get(metric) || []
      const valueOf = (year) => {
        const index = yearIndex.get(year)

        return index === undefined ? null : toNumber(data[index])
      }
      const current = valueOf(latestYear)
      const previous = valueOf(priorYear)

      return {
        id: metric,
        label: METRIC_LABELS[metric] || metric,
        previousRef: String(priorYear),
        toneMetric: metric,
        cells: {
          ...Object.fromEntries(
            years.map((year) => [String(year), { current: valueOf(year), previous: null, difference: null, pctDifference: null }]),
          ),
          delta: {
            current,
            previous,
            difference: computeDifference(current, previous),
            pctDifference: computePctDifference(current, previous),
          },
        },
      }
    }),
  }
}

const composeDepartment = async (values, fetcher, isAdmin, { departmentNames } = {}) => {
  const metrics = values.metrics
  const comparisonPeriod = {
    month: Number(values.comparisonMonth),
    year: Number(values.comparisonYear),
  }
  const [currentResponse, previousResponse] = await Promise.all([
    fetcher(
      buildParams(
        values,
        isAdmin,
        metrics,
        { groupBy: 'DEPARTMENT', month: values.month, year: [values.year] },
        { includeDepartment: false },
      ),
    ),
    fetcher(
      buildParams(
        values,
        isAdmin,
        metrics,
        {
          groupBy: 'DEPARTMENT',
          month: comparisonPeriod.month,
          year: [comparisonPeriod.year],
        },
        { includeDepartment: false },
      ),
    ),
  ])

  const indexDepartments = (response) => {
    const { labels, byMetric } = indexResponse(response)

    return new Map(
      labels.map((label, index) => [
        String(label),
        Object.fromEntries([...byMetric].map(([metric, data]) => [metric, toNumber(data[index])])),
      ]),
    )
  }

  const currentByDept = indexDepartments(currentResponse)
  const previousByDept = indexDepartments(previousResponse)
  const departmentIds = [...new Set([...currentByDept.keys(), ...previousByDept.keys()])].sort()

  return {
    mode: values.mode,
    rowDimension: 'Department',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: formatMonthTitle(values.month, values.year),
    previousHeader: formatMonthTitle(comparisonPeriod.month, comparisonPeriod.year),
    summaryEnabled: true,
    title: `Departments — ${formatMonthTitle(values.month, values.year)} vs ${formatMonthTitle(comparisonPeriod.month, comparisonPeriod.year)}`,
    rows: departmentIds.map((departmentId) => ({
      id: departmentId,
      label: departmentNames?.get(departmentId) || departmentId,
      previousRef: formatMonthTitle(comparisonPeriod.month, comparisonPeriod.year),
      toneMetric: null,
      cells: buildCells(metrics, currentByDept.get(departmentId), previousByDept.get(departmentId)),
    })),
  }
}

// All six metrics of one month vs the previous month. January reaches back
// into December of the prior year, which switches the API's month labels
// from "12" to "YYYY-12" — parseMonthLabel handles both.
const composeMetricComparison = async (values, fetcher, isAdmin) => {
  const month = Number(values.month)
  const year = Number(values.year)
  const previous = previousMonthOf(month, year)
  const requestYears = previous.year === year ? [year] : [previous.year, year]

  const response = await fetcher(
    buildParams(values, isAdmin, ALL_METRIC_KEYS, { groupBy: 'MONTH', year: requestYears }),
  )
  const buckets = buildMonthBuckets(response, year)
  const findBucket = (targetMonth, targetYear) =>
    buckets.find((bucket) => bucket.month === targetMonth && bucket.year === targetYear)

  const currentValues = findBucket(month, year)?.values || {}
  const previousValues = findBucket(previous.month, previous.year)?.values || {}
  const grossCurrent = currentValues.gross ?? null

  return {
    mode: values.mode,
    rowDimension: 'Metric',
    columnGroups: [{ key: 'value', label: 'Value', kind: 'delta' }],
    currentHeader: formatMonthTitle(month, year),
    previousHeader: formatMonthTitle(previous.month, previous.year),
    summaryEnabled: true,
    title: `Metrics — ${formatMonthTitle(month, year)} vs ${formatMonthTitle(previous.month, previous.year)}`,
    rows: ALL_METRIC_KEYS.map((metric) => {
      const current = currentValues[metric] ?? null
      const previousValue = previousValues[metric] ?? null

      return {
        id: metric,
        label: METRIC_LABELS[metric] || metric,
        previousRef: formatMonthTitle(previous.month, previous.year),
        toneMetric: metric,
        shareOfGross:
          current === null || grossCurrent === null || grossCurrent === 0
            ? null
            : (current / grossCurrent) * 100,
        cells: {
          value: {
            current,
            previous: previousValue,
            difference: computeDifference(current, previousValue),
            pctDifference: computePctDifference(current, previousValue),
          },
        },
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// Daily composers. The API only supports groupBy=DATE for daily reports, so
// every daily mode is composed from one from/to range fetch whose labels are
// ISO dates ("2026-06-05").
// ---------------------------------------------------------------------------

const buildDailyParams = (values, metrics, extra = {}) => ({
  reportType: 'DAILY',
  groupBy: 'DATE',
  aggregate: values.aggregate || 'SUM',
  metric: metrics,
  ...(values.storeId ? { storeIds: [values.storeId] } : {}),
  ...extra,
})

// [{ date: 'YYYY-MM-DD', values: { metricKey: number|null } }], chronological.
// Only days with data appear — the API does not zero-fill.
const buildDayBuckets = (response) => {
  const { labels, byMetric } = indexResponse(response)

  return labels
    .map((label, index) => ({
      date: String(label).slice(0, 10),
      values: Object.fromEntries(
        [...byMetric].map(([metric, data]) => [metric, toNumber(data[index])]),
      ),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const composeDayOverDay = async (values, fetcher) => {
  const metrics = values.metrics
  const response = await fetcher(
    buildDailyParams(values, metrics, { from: values.fromDate, to: values.toDate }),
  )
  const buckets = buildDayBuckets(response)

  return {
    mode: values.mode,
    rowDimension: 'Day',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: 'Current',
    previousHeader: 'Previous',
    summaryEnabled: true,
    title: `Day over Day — ${formatIsoDate(values.fromDate)} to ${formatIsoDate(values.toDate)}`,
    rows: buckets.map((bucket, index) => {
      const previousBucket = buckets[index - 1] || null

      return {
        id: bucket.date,
        label: formatIsoDate(bucket.date),
        previousRef: previousBucket ? formatIsoDate(previousBucket.date) : null,
        toneMetric: null,
        cells: buildCells(metrics, bucket.values, previousBucket?.values),
      }
    }),
  }
}

const composeOneDayVsRange = async (values, fetcher) => {
  const metrics = values.metrics
  const reference = values.referenceDate
  // One fetch covering both the display range and the reference day (ISO
  // dates compare correctly as strings).
  const from = reference < values.fromDate ? reference : values.fromDate
  const to = reference > values.toDate ? reference : values.toDate
  const response = await fetcher(buildDailyParams(values, metrics, { from, to }))
  const buckets = buildDayBuckets(response)
  const referenceValues = buckets.find((bucket) => bucket.date === reference)?.values

  const days = buckets.filter(
    (bucket) =>
      bucket.date !== reference && bucket.date >= values.fromDate && bucket.date <= values.toDate,
  )

  return {
    mode: values.mode,
    rowDimension: 'Day',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: 'Current',
    previousHeader: `Reference (${formatIsoDate(reference)})`,
    summaryEnabled: true,
    title: `Days vs ${formatIsoDate(reference)}`,
    rows: days.map((bucket) => ({
      id: bucket.date,
      label: formatIsoDate(bucket.date),
      previousRef: formatIsoDate(reference),
      toneMetric: null,
      cells: buildCells(metrics, bucket.values, referenceValues),
    })),
  }
}

const composeSelectedDays = async (values, fetcher) => {
  const metrics = values.metrics
  const days = [...(values.comparisonDates || [])].sort()
  const response = await fetcher(
    buildDailyParams(values, metrics, { from: days[0], to: days[days.length - 1] }),
  )
  const bucketByDate = new Map(buildDayBuckets(response).map((bucket) => [bucket.date, bucket]))

  return {
    mode: values.mode,
    rowDimension: 'Day',
    columnGroups: metricColumnGroups(metrics),
    currentHeader: 'Current',
    previousHeader: 'Compared With',
    summaryEnabled: true,
    title: 'Selected Days (Sequential)',
    rows: days.map((day, index) => {
      const previousDay = index > 0 ? days[index - 1] : null

      return {
        id: day,
        label: formatIsoDate(day),
        previousRef: previousDay ? formatIsoDate(previousDay) : null,
        toneMetric: null,
        cells: buildCells(
          metrics,
          bucketByDate.get(day)?.values,
          previousDay ? bucketByDate.get(previousDay)?.values : undefined,
        ),
      }
    }),
  }
}

// All nine daily metrics of one day vs the previous day. Share column uses
// Grocery Total as the base (the daily analogue of Gross). Summary is off:
// counts and currency amounts cannot be meaningfully summed together.
const composeDailyMetricComparison = async (values, fetcher) => {
  const day = values.date
  const previousDay = previousDayOf(day)
  const response = await fetcher(
    buildDailyParams(values, ALL_DAILY_METRIC_KEYS, { from: previousDay, to: day }),
  )
  const bucketByDate = new Map(buildDayBuckets(response).map((bucket) => [bucket.date, bucket]))

  const currentValues = bucketByDate.get(day)?.values || {}
  const previousValues = bucketByDate.get(previousDay)?.values || {}
  const groceryCurrent = currentValues.groceryTotal ?? null

  return {
    mode: values.mode,
    rowDimension: 'Metric',
    columnGroups: [{ key: 'value', label: 'Value', kind: 'delta' }],
    currentHeader: formatIsoDate(day),
    previousHeader: formatIsoDate(previousDay),
    summaryEnabled: false,
    shareHeader: '% of Grocery Total',
    title: `Daily Metrics — ${formatIsoDate(day)} vs ${formatIsoDate(previousDay)}`,
    rows: ALL_DAILY_METRIC_KEYS.map((metric) => {
      const current = currentValues[metric] ?? null
      const previousValue = previousValues[metric] ?? null

      return {
        id: metric,
        label: METRIC_LABELS[metric] || metric,
        previousRef: formatIsoDate(previousDay),
        toneMetric: metric,
        shareOfGross:
          current === null || groceryCurrent === null || groceryCurrent === 0
            ? null
            : (current / groceryCurrent) * 100,
        cells: {
          value: {
            current,
            previous: previousValue,
            difference: computeDifference(current, previousValue),
            pctDifference: computePctDifference(current, previousValue),
          },
        },
      }
    }),
  }
}

const COMPOSERS = {
  [COMPARISON_MODES.MONTH_OVER_MONTH]: composeMonthOverMonth,
  [COMPARISON_MODES.ONE_VS_MANY]: composeOneVsMany,
  [COMPARISON_MODES.SELECTED_MONTHS]: composeSelectedMonths,
  [COMPARISON_MODES.YEAR_OVER_YEAR]: composeYearOverYear,
  [COMPARISON_MODES.DEPARTMENT]: composeDepartment,
  [COMPARISON_MODES.METRIC]: composeMetricComparison,
  [COMPARISON_MODES.DAY_OVER_DAY]: composeDayOverDay,
  [COMPARISON_MODES.ONE_DAY_VS_RANGE]: composeOneDayVsRange,
  [COMPARISON_MODES.SELECTED_DAYS]: composeSelectedDays,
  [COMPARISON_MODES.DAILY_METRIC]: composeDailyMetricComparison,
}

export const composeComparison = async (values, fetcher, isAdmin, options = {}) => {
  const composer = COMPOSERS[values.mode]

  if (!composer) {
    throw new Error(`Unsupported comparison mode: ${values.mode}`)
  }

  const result = await composer(values, fetcher, isAdmin, options)

  return {
    ...result,
    // sortValue keeps the label column sortable in report order (Jan < Feb)
    // instead of alphabetically.
    rows: result.rows.map((row, index) => ({ ...row, sortValue: index })),
  }
}
