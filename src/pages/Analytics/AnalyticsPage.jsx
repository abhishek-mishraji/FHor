import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import KpiGrid from '../../components/common/KpiGrid'
import PaginationBar from '../../components/common/PaginationBar'
import CheckboxGroupInput from '../../components/forms/CheckboxGroupInput'
import MultiSelectInput from '../../components/forms/MultiSelectInput'
import SelectInput from '../../components/forms/SelectInput'
import TextInput from '../../components/forms/TextInput'
import AnalyticsChart from '../../components/charts/AnalyticsChart'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useSavedReports } from '../../hooks/useSavedReports'
import { useTable } from '../../hooks/useTable'
import analyticsService from '../../services/analyticsService'
import { composeAnalytics } from '../../services/analyticsComposer'
import clientService from '../../services/clientService'
import monthlyReportService from '../../services/monthlyReportService'
import storeService from '../../services/storeService'
import {
  ADMIN_SCOPES,
  AGGREGATES,
  AGGREGATE_OPTIONS,
  CHART_SUGGESTIONS,
  CHART_TYPE_OPTIONS,
  GROUP_BY,
  GROUP_BY_BY_REPORT_TYPE,
  GROUP_BY_HINTS,
  GROUP_BY_LABELS,
  METRICS_BY_REPORT_TYPE,
  REPORT_TYPES,
  REPORT_TYPE_OPTIONS,
  VIEW_MODES,
  VIEW_MODE_OPTIONS,
} from '../../constants/analyticsConstants'
import {
  buildChartRows,
  buildExportMatrix,
  buildKpiSummaries,
  buildTableColumns,
} from '../../utils/analyticsTransforms'
import { getYearOptions } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { exportChartPng, exportCsv, exportExcel, exportPdf } from '../../utils/exportUtils'
import { validateAnalyticsForm } from '../../validations/analyticsValidation'
import '../../page-styles/Analytics/Analytics.css'

const monthShortFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

const monthCheckboxOptions = Array.from({ length: 12 }, (_, index) => ({
  label: monthShortFormatter.format(new Date(2026, index, 1)),
  value: index + 1,
}))

const yearCheckboxOptions = getYearOptions(new Date().getFullYear(), 3).map((option) => ({
  label: option.label,
  value: String(option.value),
}))

const isoDate = (date) => date.toISOString().slice(0, 10)

const defaultDailyRange = () => ({
  from: isoDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
  to: isoDate(new Date()),
})

const initialBuilderValues = {
  reportType: REPORT_TYPES.MONTHLY,
  groupBy: GROUP_BY.MONTH,
  metrics: ['gross', 'netSales'],
  aggregate: AGGREGATES.SUM,
  scope: ADMIN_SCOPES.STORES,
  storeIds: [],
  clientId: '',
  from: '',
  to: '',
  months: [],
  years: [String(new Date().getFullYear())],
  departmentId: '',
}

function AnalyticsPage() {
  const { notify } = useContext(AppContext)
  const { isAdmin } = usePermissions()
  const [builderValues, setBuilderValues] = useState(initialBuilderValues)
  const [builderErrors, setBuilderErrors] = useState({})
  const [chartType, setChartType] = useState(CHART_SUGGESTIONS[initialBuilderValues.groupBy])
  const [viewMode, setViewMode] = useState(VIEW_MODES.FULL)
  const [displayMode, setDisplayMode] = useState('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [hiddenMetrics, setHiddenMetrics] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [saveModal, setSaveModal] = useState({ isOpen: false, mode: 'save', reportId: null, name: '' })
  const [exporting, setExporting] = useState(false)
  const [lastRunSignature, setLastRunSignature] = useState(null)
  const [storeLabelDisplay, setStoreLabelDisplay] = useState('name')
  const [deptLabelDisplay, setDeptLabelDisplay] = useState('both')
  const chartContainerRef = useRef(null)
  const hasAutoRunRef = useRef(false)
  const deptLookupFiredRef = useRef(false)

  const { savedReports, saveReport, renameReport, deleteReport } = useSavedReports()

  const storesQuery = useApi(
    () => (isAdmin ? storeService.getStores() : storeService.getClientStores()),
    { auto: true, initialData: [] },
  )

  const clientsQuery = useApi(() => clientService.getClients(), {
    auto: isAdmin,
    initialData: [],
  })

  const storeOptions = useMemo(
    () =>
      (storesQuery.data || []).map((store) => ({
        label: store.storeName,
        value: String(store.storeId),
      })),
    [storesQuery.data],
  )

  const clientOptions = useMemo(
    () =>
      (clientsQuery.data || []).map((client) => ({
        label: client.fullName,
        value: String(client.clientId),
      })),
    [clientsQuery.data],
  )

  const analyticsQuery = useApi(
    ({ values }) =>
      composeAnalytics(
        values,
        isAdmin ? analyticsService.getAdminAnalytics : analyticsService.getClientAnalytics,
        isAdmin,
      ),
    {
      auto: false,
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({
          type: 'error',
          title: 'Analytics query failed',
          message: details.message,
        })
      },
    },
  )

  // Lazy lookup: fired once when groupBy=DEPARTMENT is first selected.
  // Monthly reports carry both departmentId and departmentName on every row.
  // Admins use the single admin list endpoint; clients fetch per-store and flatten.
  const deptLookupQuery = useApi(
    ({ stores, admin }) =>
      admin
        ? monthlyReportService.getAdminReports()
        : Promise.all(
            stores.map((store) => monthlyReportService.getClientReportsByStore(store.value)),
          ).then((results) => results.flat()),
    { auto: false, initialData: [] },
  )

  useEffect(() => {
    if (builderValues.groupBy !== GROUP_BY.DEPARTMENT) return
    if (deptLookupFiredRef.current) return
    if (!isAdmin && !storeOptions.length) return
    deptLookupFiredRef.current = true
    deptLookupQuery.execute({ stores: storeOptions, admin: isAdmin }).catch(() => {})
  }, [isAdmin, builderValues.groupBy, storeOptions, deptLookupQuery.execute])

  const deptNameById = useMemo(() => {
    const map = new Map()
    for (const row of deptLookupQuery.data || []) {
      if (row.departmentId != null && row.departmentName) {
        map.set(String(row.departmentId), row.departmentName)
      }
    }
    return map
  }, [deptLookupQuery.data])

  const metricOptions = METRICS_BY_REPORT_TYPE[builderValues.reportType] || []
  const groupByOptions = (GROUP_BY_BY_REPORT_TYPE[builderValues.reportType] || []).map(
    (groupBy) => ({ label: GROUP_BY_LABELS[groupBy], value: groupBy }),
  )

  const runReport = useCallback(
    (values) => {
      // Admin convenience: an empty store selection means "all stores".
      const effectiveValues =
        isAdmin &&
        values.scope === ADMIN_SCOPES.STORES &&
        !values.storeIds.length &&
        storeOptions.length
          ? { ...values, storeIds: storeOptions.map((option) => option.value) }
          : values

      const nextErrors = validateAnalyticsForm(effectiveValues, { isAdmin })
      setBuilderErrors(nextErrors)

      if (Object.keys(nextErrors).length) {
        notify({
          type: 'error',
          title: 'Report configuration incomplete',
          message: Object.values(nextErrors)[0],
        })
        return
      }

      setHiddenMetrics([])
      setSearchTerm('')
      setLastRunSignature(JSON.stringify(values))
      analyticsQuery.execute({ values: effectiveValues }).catch(() => {})
    },
    [analyticsQuery, isAdmin, notify, storeOptions],
  )

  // Show data immediately on first visit. Wait for the store list on both
  // admin (all-stores default) and client (store selector needs options).
  useEffect(() => {
    if (hasAutoRunRef.current) {
      return
    }

    // Still fetching — wait until the list arrives (or confirms empty).
    if (storesQuery.loading) {
      return
    }

    hasAutoRunRef.current = true

    const timeoutId = window.setTimeout(() => {
      runReport(builderValues)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [storesQuery.loading, storeOptions, runReport, builderValues])

  const handleBuilderChange = (event) => {
    const { name, value } = event.target

    setBuilderValues((currentValues) => {
      if (name === 'reportType' && value !== currentValues.reportType) {
        const nextGroupBy = GROUP_BY_BY_REPORT_TYPE[value][0]
        setChartType(CHART_SUGGESTIONS[nextGroupBy])

        // Metrics and period filters are report-type specific: swap in
        // sensible defaults so the report stays runnable.
        const defaults =
          value === REPORT_TYPES.DAILY
            ? { metrics: ['groceryTotal'], months: [], years: [], ...defaultDailyRange() }
            : {
                metrics: ['gross', 'netSales'],
                from: '',
                to: '',
                months: [],
                years: [String(new Date().getFullYear())],
              }

        return {
          ...currentValues,
          reportType: value,
          groupBy: nextGroupBy,
          departmentId: '',
          ...defaults,
        }
      }

      if (name === 'groupBy' && value !== currentValues.groupBy) {
        setChartType(CHART_SUGGESTIONS[value])
      }

      return {
        ...currentValues,
        [name]: value,
      }
    })
  }

  const analytics = analyticsQuery.data
  const groupByUsed = analytics?.meta?.groupBy || builderValues.groupBy

  const chartRows = useMemo(() => buildChartRows(analytics, groupByUsed), [analytics, groupByUsed])
  const kpiSummaries = useMemo(() => buildKpiSummaries(analytics), [analytics])

  const visibleColumns = useMemo(
    () => buildTableColumns(analytics, groupByUsed, hiddenMetrics),
    [analytics, groupByUsed, hiddenMetrics],
  )

  // Map storeId → storeName for the admin store-label display feature.
  const storeNameById = useMemo(
    () => new Map(storeOptions.map((o) => [o.value, o.label])),
    [storeOptions],
  )

  // Rewrite the `label` field on each row when the user picks Name or Both.
  // Works for both admin and client — storeNameById uses whichever stores are loaded.
  const displayRows = useMemo(() => {
    if (groupByUsed === GROUP_BY.STORE) {
      return chartRows.map((row) => {
        const id = String(row.label)
        const name = storeNameById.get(id) ?? id
        const label =
          storeLabelDisplay === 'name' ? name
          : storeLabelDisplay === 'both' ? `${name}  (${id})`
          : id
        return { ...row, label }
      })
    }

    if (groupByUsed === GROUP_BY.DEPARTMENT) {
      return chartRows.map((row) => {
        const id = String(row.label)
        const name = deptNameById.get(id) ?? id
        const label =
          deptLabelDisplay === 'name' ? name
          : deptLabelDisplay === 'both' ? `${name}  (ID: ${id})`
          : id
        return { ...row, label }
      })
    }

    return chartRows
  }, [chartRows, groupByUsed, storeLabelDisplay, storeNameById, deptLabelDisplay, deptNameById])

  // Update the label column header to match the selected display mode.
  const displayColumns = useMemo(() => {
    if (groupByUsed === GROUP_BY.STORE) {
      const labelHeader =
        storeLabelDisplay === 'name' ? 'Store Name'
        : storeLabelDisplay === 'both' ? 'Store'
        : 'Store ID'
      return visibleColumns.map((col) =>
        col.key === 'label' ? { ...col, header: labelHeader } : col,
      )
    }

    if (groupByUsed === GROUP_BY.DEPARTMENT) {
      const labelHeader =
        deptLabelDisplay === 'name' ? 'Department'
        : deptLabelDisplay === 'both' ? 'Department'
        : 'Dept. ID'
      return visibleColumns.map((col) =>
        col.key === 'label' ? { ...col, header: labelHeader } : col,
      )
    }

    return visibleColumns
  }, [visibleColumns, groupByUsed, storeLabelDisplay, deptLabelDisplay])

  const {
    page,
    totalItems,
    totalPages,
    pageItems,
    pageSize,
    setPage,
    setPageSize,
    filteredData,
  } = useTable({
    data: displayRows,
    searchTerm,
    searchFields: ['label'],
  })

  const exportFilename = `analytics_${builderValues.reportType.toLowerCase()}_${groupByUsed.toLowerCase()}`
  const exportSubtitle = analytics?.meta
    ? `${analytics.meta.reportType} report grouped by ${analytics.meta.groupBy} (${analytics.meta.aggregate}) — ${analytics.meta.totalDataPoints} data points`
    : ''

  const handleExport = async (format) => {
    if (!filteredData.length) {
      notify({ type: 'error', title: 'Nothing to export', message: 'Run a report first.' })
      return
    }

    setExporting(true)

    try {
      const matrix = buildExportMatrix(displayColumns, filteredData)

      if (format === 'csv') {
        exportCsv(matrix, exportFilename)
      } else if (format === 'excel') {
        exportExcel(matrix, exportFilename)
      } else if (format === 'png') {
        await exportChartPng(chartContainerRef.current, exportFilename)
      } else if (format === 'pdf') {
        await exportPdf({
          title: 'Hands Off Retail — Analytics Report',
          subtitle: exportSubtitle,
          matrix,
          chartContainer: chartContainerRef.current,
        })
      }
    } catch (exportError) {
      notify({
        type: 'error',
        title: 'Export failed',
        message: exportError.message || 'The export could not be generated.',
      })
    } finally {
      setExporting(false)
    }
  }

  const toggleMetricVisibility = (metric) => {
    setHiddenMetrics((currentHidden) =>
      currentHidden.includes(metric)
        ? currentHidden.filter((hiddenMetric) => hiddenMetric !== metric)
        : [...currentHidden, metric],
    )
  }

  const openSaveModal = () => setSaveModal({ isOpen: true, mode: 'save', reportId: null, name: '' })
  const openRenameModal = (report) =>
    setSaveModal({ isOpen: true, mode: 'rename', reportId: report.id, name: report.name })
  const closeSaveModal = () => setSaveModal({ isOpen: false, mode: 'save', reportId: null, name: '' })

  const handleSaveModalSubmit = (event) => {
    event.preventDefault()

    const name = saveModal.name.trim()

    if (!name) {
      return
    }

    if (saveModal.mode === 'rename') {
      renameReport(saveModal.reportId, name)
      notify({ type: 'success', title: 'Report renamed', message: `Saved report is now "${name}".` })
    } else {
      saveReport(name, { ...builderValues, chartType, viewMode })
      notify({ type: 'success', title: 'Report saved', message: `"${name}" stored in this browser.` })
    }

    closeSaveModal()
  }

  const loadSavedReport = (report) => {
    const { chartType: savedChartType, viewMode: savedViewMode, month, ...savedValues } = report.config

    // Reports saved before multi-month support stored a single `month` value.
    if (month && !savedValues.months?.length) {
      savedValues.months = [Number(month)]
    }

    const nextValues = { ...initialBuilderValues, ...savedValues }

    setBuilderValues(nextValues)
    setChartType(savedChartType || CHART_SUGGESTIONS[nextValues.groupBy])
    setViewMode(savedViewMode || VIEW_MODES.FULL)
    runReport(nextValues)
  }

  const isDaily = builderValues.reportType === REPORT_TYPES.DAILY

  // displayMode drives the new 3-way visibility toggle (UI only — no API impact).
  // viewMode is kept for saved-report compatibility (chart vs table sub-selection).
  const showKpis = displayMode !== 'analytics'
  const showChart = displayMode !== 'kpi' && viewMode !== VIEW_MODES.TABLE
  const showTable = displayMode !== 'kpi' && viewMode !== VIEW_MODES.CHART

  const hasResult = Boolean(analytics?.labels?.length)
  const isDirty = Boolean(
    analytics && lastRunSignature && lastRunSignature !== JSON.stringify(builderValues),
  )

  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow={isAdmin ? 'Analytics workspace' : 'Store analytics'}
        title="Analytics builder"
        description="Pick what you want to measure, choose the period, and press Run report. Every combination of metrics, months, years, and stores is supported."
        actions={
          <Button type="button" variant="secondary" onClick={openSaveModal}>
            Save report
          </Button>
        }
      />

      {/* ── Filter Bar ── */}
      <div className="analytics-filter-bar">
        <div className="analytics-filter-bar__header">
          <span className="analytics-filter-bar__heading">Report configuration</span>
          <button
            type="button"
            className="analytics-filter-bar__toggle"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            Filters
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        <div className={`analytics-filter-bar__body${filtersOpen ? ' is-open' : ''}`}>
          {/* Row 1 — primary selects + admin scope */}
          <div className="analytics-filter-bar__row">
            <div className="analytics-filter-bar__field">
              <SelectInput
                label="Report type"
                name="reportType"
                value={builderValues.reportType}
                onChange={handleBuilderChange}
                options={REPORT_TYPE_OPTIONS}
                placeholder="Select report type"
                error={builderErrors.reportType}
              />
            </div>
            <div className="analytics-filter-bar__field">
              <SelectInput
                label="Group by"
                name="groupBy"
                value={builderValues.groupBy}
                onChange={handleBuilderChange}
                options={groupByOptions}
                placeholder="Select grouping"
                error={builderErrors.groupBy}
              />
            </div>
            <div className="analytics-filter-bar__field">
              <SelectInput
                label="Calculation"
                name="aggregate"
                value={builderValues.aggregate}
                onChange={handleBuilderChange}
                options={AGGREGATE_OPTIONS}
                placeholder="Select calculation"
                error={builderErrors.aggregate}
              />
            </div>
            {isAdmin ? (
              <div className="analytics-filter-bar__field">
                <SelectInput
                  label="Data scope"
                  name="scope"
                  value={builderValues.scope}
                  onChange={handleBuilderChange}
                  options={[
                    { label: 'By stores', value: ADMIN_SCOPES.STORES },
                    { label: 'By client', value: ADMIN_SCOPES.CLIENT },
                  ]}
                  placeholder="Select scope"
                />
              </div>
            ) : null}
            {isAdmin && builderValues.scope === ADMIN_SCOPES.CLIENT ? (
              <div className="analytics-filter-bar__field analytics-filter-bar__field--grow">
                <SelectInput
                  label="Client"
                  name="clientId"
                  value={builderValues.clientId}
                  onChange={handleBuilderChange}
                  options={clientOptions}
                  placeholder="Select a client"
                  error={builderErrors.clientId}
                />
              </div>
            ) : (
              <div className="analytics-filter-bar__field analytics-filter-bar__field--grow">
                <MultiSelectInput
                  label="Stores"
                  name="storeIds"
                  values={builderValues.storeIds}
                  onChange={handleBuilderChange}
                  options={storeOptions}
                  placeholder={isAdmin ? 'All stores' : 'All your stores'}
                  error={builderErrors.storeIds}
                />
              </div>
            )}
          </div>

          {builderValues.groupBy ? (
            <p className="analytics-filter-bar__hint">{GROUP_BY_HINTS[builderValues.groupBy]}</p>
          ) : null}

          {/* Row 2 — metrics + period controls */}
          <div className="analytics-filter-bar__row">
            <div className="analytics-filter-bar__field analytics-filter-bar__field--metrics">
              <CheckboxGroupInput
                label="Metrics"
                name="metrics"
                values={builderValues.metrics}
                onChange={handleBuilderChange}
                options={metricOptions}
                error={builderErrors.metrics}
              />
            </div>

            {isDaily ? (
              <>
                <div className="analytics-filter-bar__field analytics-filter-bar__field--date">
                  <TextInput
                    label="From date"
                    name="from"
                    type="date"
                    value={builderValues.from}
                    onChange={handleBuilderChange}
                    error={builderErrors.from}
                  />
                </div>
                <div className="analytics-filter-bar__field analytics-filter-bar__field--date">
                  <TextInput
                    label="To date"
                    name="to"
                    type="date"
                    value={builderValues.to}
                    onChange={handleBuilderChange}
                    error={builderErrors.to}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="analytics-filter-bar__field">
                  <CheckboxGroupInput
                    label="Years"
                    name="years"
                    values={builderValues.years}
                    onChange={handleBuilderChange}
                    options={yearCheckboxOptions}
                    showBulkActions={false}
                    error={builderErrors.years}
                  />
                </div>
                <div className="analytics-filter-bar__field analytics-filter-bar__field--months">
                  <CheckboxGroupInput
                    label="Months"
                    name="months"
                    values={builderValues.months}
                    onChange={handleBuilderChange}
                    options={monthCheckboxOptions}
                    hint="Tick any months to compare them. Nothing ticked = all months."
                    error={builderErrors.months}
                  />
                </div>
                <div className="analytics-filter-bar__field analytics-filter-bar__field--date">
                  <TextInput
                    label="Department (optional)"
                    name="departmentId"
                    value={builderValues.departmentId}
                    onChange={handleBuilderChange}
                    placeholder="All departments — or e.g. A1"
                    error={builderErrors.departmentId}
                  />
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Sticky Action Bar ── */}
      <div className="analytics-action-bar">
        <div className="analytics-action-bar__left">
          {isDirty ? (
            <span className="analytics-page__dirty">Filters changed — run again</span>
          ) : null}
        </div>

        <div className="analytics-action-bar__controls">
          <div className="analytics-action-bar__select">
            <label className="analytics-action-bar__label" htmlFor="ab-display-mode">
              View
            </label>
            <select
              id="ab-display-mode"
              className="analytics-action-bar__native-select"
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value)}
            >
              <option value="all">Analytics + KPI</option>
              <option value="analytics">Analytics Only</option>
              <option value="kpi">KPI Only</option>
            </select>
          </div>
          <div className="analytics-action-bar__select">
            <label className="analytics-action-bar__label" htmlFor="ab-chart-type">
              Chart
            </label>
            <select
              id="ab-chart-type"
              className="analytics-action-bar__native-select"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              {CHART_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="analytics-action-bar__divider" />

        <div className="analytics-action-bar__exports">
          <span className="analytics-results__exports-label">Export</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={exporting || !hasResult}
            onClick={() => handleExport('csv')}
          >
            CSV
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={exporting || !hasResult}
            onClick={() => handleExport('excel')}
          >
            Excel
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={exporting || !hasResult}
            onClick={() => handleExport('pdf')}
          >
            PDF
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={exporting || !hasResult || !showChart}
            onClick={() => handleExport('png')}
          >
            PNG
          </Button>
        </div>

        <div className="analytics-action-bar__divider" />

        <Button
          type="button"
          onClick={() => runReport(builderValues)}
          isLoading={analyticsQuery.loading}
        >
          Run report
        </Button>
      </div>

      {/* ── Full-width Results ── */}
      <div className="analytics-results-section">
        <Card
          className="analytics-results"
          subtitle={exportSubtitle || 'Run a report to see analytics here'}
        >
          <AsyncState
            isLoading={analyticsQuery.loading}
            error={analyticsQuery.error}
            isEmpty={false}
          >
            {hasResult ? (
              <div className="analytics-results__body">
                {showKpis ? <KpiGrid summaries={kpiSummaries} /> : null}

                {showChart ? (
                  <AnalyticsChart
                    ref={chartContainerRef}
                    chartType={chartType}
                    rows={displayRows}
                    datasets={analytics.datasets}
                  />
                ) : null}

                {showTable ? (
                  <div className="analytics-table">
                    <div className="analytics-table__controls">
                      <TextInput
                        label="Search rows"
                        name="tableSearch"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder={`Filter by ${GROUP_BY_LABELS[groupByUsed]?.toLowerCase() || 'label'}`}
                      />
                      <div className="analytics-table__visibility">
                        <span className="form-field__label">Columns</span>
                        <div className="analytics-table__chips">
                          {analytics.datasets.map((dataset) => (
                            <button
                              key={dataset.metric}
                              type="button"
                              className={`analytics-chip ${
                                hiddenMetrics.includes(dataset.metric) ? 'analytics-chip--off' : ''
                              }`.trim()}
                              onClick={() => toggleMetricVisibility(dataset.metric)}
                              title="Toggle column visibility (UI only — hidden columns are excluded from exports)"
                            >
                              {dataset.label}
                            </button>
                          ))}
                        </div>

                        {groupByUsed === GROUP_BY.STORE ? (
                          <>
                            <span className="form-field__label analytics-table__label-mode-heading">
                              Store column
                            </span>
                            <div className="analytics-table__chips">
                              {[
                                { value: 'name', label: 'Name' },
                                { value: 'id', label: 'ID' },
                                { value: 'both', label: 'Name + ID' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`analytics-chip ${
                                    storeLabelDisplay !== opt.value ? 'analytics-chip--off' : ''
                                  }`.trim()}
                                  onClick={() => setStoreLabelDisplay(opt.value)}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : null}

                        {groupByUsed === GROUP_BY.DEPARTMENT ? (
                          <>
                            <span className="form-field__label analytics-table__label-mode-heading">
                              Department column
                            </span>
                            <div className="analytics-table__chips">
                              {[
                                { value: 'name', label: 'Name' },
                                { value: 'id', label: 'ID' },
                                { value: 'both', label: 'Name + ID' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`analytics-chip ${
                                    deptLabelDisplay !== opt.value ? 'analytics-chip--off' : ''
                                  }`.trim()}
                                  onClick={() => setDeptLabelDisplay(opt.value)}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <DataTable
                      columns={displayColumns}
                      rows={pageItems}
                      keyField="label"
                      emptyTitle="No rows match"
                      emptyDescription="Adjust the row search to see data."
                    />
                    <PaginationBar
                      page={page}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      pageSize={pageSize}
                      onPageChange={setPage}
                      onPageSizeChange={setPageSize}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title={analytics ? 'No data for this combination' : 'Build your first report'}
                description={
                  analytics
                    ? 'No rows matched these filters. Try more months, more years, or a wider store scope.'
                    : 'Configure the filters above, then press Run report.'
                }
              />
            )}
          </AsyncState>
        </Card>
      </div>

      <Modal
        isOpen={saveModal.isOpen}
        title={saveModal.mode === 'rename' ? 'Rename saved report' : 'Save report configuration'}
        onClose={closeSaveModal}
      >
        <form className="form-grid" onSubmit={handleSaveModalSubmit}>
          <TextInput
            label="Report name"
            name="reportName"
            value={saveModal.name}
            onChange={(event) =>
              setSaveModal((currentModal) => ({ ...currentModal, name: event.target.value }))
            }
            placeholder="e.g. Monthly net sales by store"
            autoFocus
          />
          <Button type="submit" disabled={!saveModal.name.trim()}>
            {saveModal.mode === 'rename' ? 'Rename' : 'Save'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default AnalyticsPage
