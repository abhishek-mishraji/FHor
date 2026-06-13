import {
  ADMIN_SCOPES,
  GROUP_BY,
  REPORT_TYPES,
} from '../constants/analyticsConstants'

const monthShortFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

const monthShortLabel = (month) =>
  monthShortFormatter.format(new Date(2026, Number(month) - 1, 1))

const buildBaseParams = (values, isAdmin) => {
  const params = {
    reportType: values.reportType,
    groupBy: values.groupBy,
    metric: values.metrics,
    aggregate: values.aggregate,
  }

  if (values.reportType === REPORT_TYPES.DAILY) {
    params.from = values.from
    params.to = values.to
  } else {
    params.departmentId = values.departmentId
  }

  if (isAdmin) {
    if (values.scope === ADMIN_SCOPES.CLIENT) {
      params.clientId = values.clientId
    } else {
      params.storeIds = values.storeIds
    }
  } else if (values.storeIds?.length) {
    params.storeIds = values.storeIds
  }

  return params
}

// groupBy=MONTH responses label buckets with month numbers, so an arbitrary
// month combination is a pure client-side label filter.
const filterMonthLabels = (response, months) => {
  if (!months.length) {
    return response
  }

  const keptEntries = (response.labels || [])
    .map((label, index) => ({ label, index }))
    .filter((entry) => months.includes(Number(entry.label)))

  return {
    ...response,
    labels: keptEntries.map((entry) => entry.label),
    datasets: (response.datasets || []).map((dataset) => ({
      ...dataset,
      data: keptEntries.map((entry) => dataset.data?.[entry.index] ?? null),
    })),
  }
}

// Multi year + multi month: one response per year flattened into
// "Jan 2024", "Jun 2024", ..., "Dec 2026" labels, one dataset per metric.
const mergeYearResponses = (yearResponses, months) => {
  const datasetMeta =
    yearResponses.find(({ response }) => response.datasets?.length)?.response.datasets || []
  const labels = []
  const dataByMetric = new Map(datasetMeta.map((dataset) => [dataset.metric, []]))

  yearResponses.forEach(({ year, response }) => {
    const filtered = filterMonthLabels(response, months)

    filtered.labels.forEach((label, index) => {
      labels.push(`${monthShortLabel(label)} ${year}`)
      datasetMeta.forEach((meta) => {
        const dataset = filtered.datasets.find((candidate) => candidate.metric === meta.metric)
        dataByMetric.get(meta.metric).push(dataset?.data?.[index] ?? null)
      })
    })
  })

  return {
    labels,
    datasets: datasetMeta.map((meta) => ({
      label: meta.label,
      metric: meta.metric,
      data: dataByMetric.get(meta.metric),
    })),
  }
}

// Month comparison for STORE / DEPARTMENT / YEAR grouping: one response per
// month, aligned on the union of labels, datasets suffixed per month
// ("Net Sales (Jan)" vs "Net Sales (Mar)").
const mergeMonthResponses = (monthResponses) => {
  const labels = []

  monthResponses.forEach(({ response }) => {
    ;(response.labels || []).forEach((label) => {
      if (!labels.includes(label)) {
        labels.push(label)
      }
    })
  })

  const datasets = monthResponses.flatMap(({ month, response }) =>
    (response.datasets || []).map((dataset) => ({
      label: `${dataset.label} (${monthShortLabel(month)})`,
      metric: `${dataset.metric}_m${month}`,
      data: labels.map((label) => {
        const index = response.labels.indexOf(label)

        return index === -1 ? null : dataset.data?.[index] ?? null
      }),
    })),
  )

  return { labels, datasets }
}

export const composeAnalytics = async (values, fetcher, isAdmin) => {
  const baseParams = buildBaseParams(values, isAdmin)

  if (values.reportType === REPORT_TYPES.DAILY) {
    return fetcher(baseParams)
  }

  const months = (values.months || []).map(Number)
  const years = values.years || []
  const buildMeta = (labels) => ({
    reportType: values.reportType,
    groupBy: values.groupBy,
    aggregate: values.aggregate,
    years,
    months,
    totalDataPoints: labels.length,
  })

  if (values.groupBy === GROUP_BY.MONTH) {
    if (years.length <= 1) {
      const response = await fetcher({ ...baseParams, year: years })
      const filtered = filterMonthLabels(response, months)

      return { ...filtered, meta: { ...response.meta, ...buildMeta(filtered.labels) } }
    }

    const yearResponses = await Promise.all(
      years.map(async (year) => ({
        year,
        response: await fetcher({ ...baseParams, year: [year] }),
      })),
    )
    const merged = mergeYearResponses(yearResponses, months)

    return { ...merged, meta: buildMeta(merged.labels) }
  }

  if (months.length <= 1) {
    return fetcher({ ...baseParams, year: years, month: months[0] })
  }

  const monthResponses = await Promise.all(
    months.map(async (month) => ({
      month,
      response: await fetcher({ ...baseParams, year: years, month }),
    })),
  )
  const merged = mergeMonthResponses(monthResponses)

  return { ...merged, meta: buildMeta(merged.labels) }
}
