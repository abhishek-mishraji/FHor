import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import '../../page-styles/Analytics/Analytics.css'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/ui/EmptyState'
import { AppContext } from '../../context/appContext'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import monthlyReportService from '../../services/monthlyReportService'
import storeService from '../../services/storeService'
import {
  buildDefaultFilters,
  COMPARISON_MODES,
  DEFAULT_COLUMN_PREFS,
} from '../../constants/comparisonConstants'
import {
  buildComparisonColumns,
  computeSummary,
  getVisibleColumnGroups,
} from '../../utils/comparisonUtils'
import { buildExportMatrix, exportCsv, exportExcel, exportPdf } from '../../utils/exportUtils'
import { formatCurrency } from '../../utils/numberUtils'
import { validateComparisonForm } from '../../validations/comparisonValidation'
import ColumnSelector from './components/ColumnSelector'
import ComparisonTable from './components/ComparisonTable'
import ComparisonToolbar from './components/ComparisonToolbar'
import ExportActions from './components/ExportActions'
import SummaryTable from './components/SummaryTable'
import { useComparisonQuery } from './hooks/useComparisonQuery'

const NUMERIC_FIELDS = new Set(['year', 'month', 'referenceMonth'])
const NUMERIC_ARRAY_FIELDS = new Set(['years', 'comparisonMonths'])

const SUMMARY_CARD_ROWS = [
  { key: 'sum', label: 'SUM' },
  { key: 'avg', label: 'AVERAGE' },
  { key: 'min', label: 'MINIMUM' },
  { key: 'max', label: 'MAXIMUM' },
]

const AnalyticsPage = () => {
  const { notify } = useContext(AppContext)
  const { isAdmin } = usePermissions()

  const [filters, setFilters] = useState(buildDefaultFilters)
  const [errors, setErrors] = useState({})
  const [columnPrefs, setColumnPrefs] = useState(DEFAULT_COLUMN_PREFS)
  const [lastRun, setLastRun] = useState(null)
  const [exporting, setExporting] = useState(false)
  const exportRowsRef = useRef([])

  const handleVisibleRowsChange = useCallback((rows) => {
    exportRowsRef.current = rows
  }, [])

  const comparisonQuery = useComparisonQuery({ isAdmin, notify })
  const { result } = comparisonQuery

  const storesQuery = useApi(
    ({ signal }) =>
      isAdmin ? storeService.getStores({}, { signal }) : storeService.getClientStores({ signal }),
    { deps: [isAdmin], initialData: [] },
  )

  const storeOptions = useMemo(
    () =>
      (storesQuery.data || []).map((store) => ({
        label: store.storeName,
        value: String(store.storeId),
      })),
    [storesQuery.data],
  )

  // There is no departments endpoint: department names are discovered from
  // the monthly reports of the selected store (all client stores for clients).
  const departmentsQuery = useApi(
    async ({ signal }) => {
      if (isAdmin) {
        if (!filters.storeId) {
          return []
        }

        return monthlyReportService.getAdminReports({ storeId: filters.storeId }, { signal })
      }

      const stores = storesQuery.data || []
      const reports = await Promise.all(
        stores.map((store) =>
          monthlyReportService.getClientReportsByStore(store.storeId, { signal }).catch(() => []),
        ),
      )

      return reports.flat()
    },
    { deps: [isAdmin, filters.storeId, (storesQuery.data || []).length], initialData: [] },
  )

  const departmentNames = useMemo(() => {
    const names = new Map()

    for (const report of departmentsQuery.data || []) {
      if (report.departmentId && !names.has(String(report.departmentId))) {
        names.set(String(report.departmentId), report.departmentName || String(report.departmentId))
      }
    }

    return names
  }, [departmentsQuery.data])

  const departmentOptions = useMemo(
    () =>
      [...departmentNames.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([departmentId, departmentName]) => ({
          value: departmentId,
          label:
            departmentName === departmentId
              ? departmentId
              : `${departmentName} (${departmentId})`,
        })),
    [departmentNames],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = NUMERIC_FIELDS.has(name)
      ? value === ''
        ? ''
        : Number(value)
      : NUMERIC_ARRAY_FIELDS.has(name)
        ? value.map(Number)
        : value

    setFilters((previous) => ({ ...previous, [name]: nextValue }))
    setErrors((previous) => {
      if (!previous[name]) {
        return previous
      }

      const next = { ...previous }
      delete next[name]

      return next
    })
  }

  const handleCompare = () => {
    const validationErrors = validateComparisonForm(filters, { isAdmin })
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length) {
      notify({
        type: 'error',
        title: 'Check the filters',
        message: 'Fix the highlighted fields and run the comparison again.',
      })
      return
    }

    // Column visibility follows the newly selected metrics on every run.
    setColumnPrefs((previous) => ({ ...previous, visibleMetrics: null }))
    setLastRun(filters)
    comparisonQuery.run(filters, departmentNames)
  }

  const handleReset = () => {
    setFilters(buildDefaultFilters())
    setErrors({})
    setColumnPrefs(DEFAULT_COLUMN_PREFS)
    setLastRun(null)
    comparisonQuery.reset()
  }

  const columns = useMemo(
    () => (result ? buildComparisonColumns(result, columnPrefs) : []),
    [result, columnPrefs],
  )

  const summaryGroups = useMemo(
    () =>
      result
        ? getVisibleColumnGroups(result, columnPrefs).filter(
            (group) => group.kind === 'delta' && !group.deltaOnly,
          )
        : [],
    [result, columnPrefs],
  )

  const metricOptions = useMemo(
    () =>
      (result?.columnGroups || [])
        .filter((group) => group.metric)
        .map((group) => ({ value: group.metric, label: group.label })),
    [result],
  )

  const buildSummaryCards = () =>
    result?.summaryEnabled
      ? summaryGroups.flatMap((group) => {
          const summary = computeSummary(result.rows, group.key)

          return SUMMARY_CARD_ROWS.map((row) => ({
            label: `${row.label} — ${group.label}`,
            value:
              summary.current[row.key] === null ? '-' : formatCurrency(summary.current[row.key]),
            caption:
              summary.previous[row.key] === null
                ? undefined
                : `${result.previousHeader || 'Previous'}: ${formatCurrency(summary.previous[row.key])}`,
          }))
        })
      : undefined

  const handleExport = async (format) => {
    if (!result) {
      return
    }

    setExporting(true)

    try {
      const rowsForExport = exportRowsRef.current?.length ? exportRowsRef.current : result.rows
      const matrix = buildExportMatrix(columns, rowsForExport)
      const summaryCards = buildSummaryCards()
      const filename = `analytics-comparison-${result.mode.toLowerCase().replaceAll('_', '-')}-${new Date().toISOString().slice(0, 10)}`

      if (format === 'csv') {
        exportCsv(matrix, filename)
      } else if (format === 'excel') {
        exportExcel(matrix, filename, { summaryCards })
      } else {
        await exportPdf({
          title: 'Monthly Comparison',
          subtitle: result.title,
          matrix,
          summaryCards,
        })
      }

      notify({
        type: 'success',
        title: 'Export ready',
        message: format === 'pdf' ? 'Use the print dialog to save the PDF.' : 'Download started.',
      })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Export failed',
        message: error.message || 'Could not export the comparison.',
      })
    } finally {
      setExporting(false)
    }
  }

  const showResults = Boolean(result) || comparisonQuery.loading || Boolean(comparisonQuery.error)
  const showMetricSection =
    result?.mode !== COMPARISON_MODES.METRIC && result?.mode !== COMPARISON_MODES.YEAR_OVER_YEAR

  return (
    <div className="analytics">
      <PageHeader
        eyebrow="Analytics"
        title="Monthly Comparison"
        description="Compare sales performance across months, years, departments, and metrics."
      />

      <ComparisonToolbar
        isAdmin={isAdmin}
        values={filters}
        errors={errors}
        onChange={handleChange}
        storeOptions={storeOptions}
        storesLoading={storesQuery.loading}
        departmentOptions={departmentOptions}
        onCompare={handleCompare}
        onReset={handleReset}
        comparing={comparisonQuery.loading}
        exportSlot={
          <ExportActions disabled={!result} exporting={exporting} onExport={handleExport} />
        }
      />

      {showResults ? (
        <div className="analytics__results">
          {result?.title && !comparisonQuery.error ? (
            <p className="analytics__result-title">{result.title}</p>
          ) : null}

          <ComparisonTable
            columns={columns}
            rows={result?.rows || []}
            loading={comparisonQuery.loading}
            error={comparisonQuery.error}
            onRetry={comparisonQuery.retry}
            onVisibleRowsChange={handleVisibleRowsChange}
            searchPlaceholder={`Search by ${(result?.rowDimension || 'row').toLowerCase()}...`}
            toolbar={
              <ColumnSelector
                columnPrefs={columnPrefs}
                onChange={setColumnPrefs}
                metricOptions={metricOptions}
                showMetricSection={showMetricSection}
              />
            }
          />

          {result?.summaryEnabled && !comparisonQuery.loading && !comparisonQuery.error ? (
            <SummaryTable
              result={result}
              visibleGroups={summaryGroups}
              aggregate={lastRun?.aggregate}
            />
          ) : null}
        </div>
      ) : (
        <div className="analytics__placeholder">
          <EmptyState
            title="Run your first comparison"
            description="Choose a comparison type, set the filters above, and press Compare to build the report."
          />
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage
