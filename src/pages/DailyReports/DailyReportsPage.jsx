import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import PaginationBar from '../../components/common/PaginationBar'
import SelectInput from '../../components/forms/SelectInput'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import dailyReportService from '../../services/dailyReportService'
import clientService from '../../services/clientService'
import storeService from '../../services/storeService'
import { buildExportMatrix } from '../../utils/analyticsTransforms'
import { formatDate } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { formatCurrency, formatNumber } from '../../utils/numberUtils'
import { exportCsv, exportExcel, exportPdf } from '../../utils/exportUtils'
import { validateDailyReportForm } from '../../validations/reportValidation'
import '../../page-styles/DailyReports/DailyReports.css'

// ── Column definitions ─────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: 'storeName',    header: 'Store',          sticky: true, render: (r) => r.storeName ?? '—' },
  { key: 'reportDate',  header: 'Report date',    sticky: true, render: (r) => formatDate(r.reportDate) },
  { key: 'groceryTotal', header: 'Grocery total', render: (r) => formatCurrency(r.groceryTotal) },
  { key: 'volume',      header: 'Volume',          render: (r) => formatNumber(r.volume) },
  { key: 'cashDeposit', header: 'Cash deposit',   render: (r) => formatCurrency(r.cashDeposit) },
  { key: 'checkDeposit', header: 'Check deposit', render: (r) => formatCurrency(r.checkDeposit) },
  { key: 'overShort',   header: 'Over / short',   render: (r) => formatCurrency(r.overShort) },
  { key: 'noSale',      header: 'No sale',         render: (r) => formatNumber(r.noSale) },
  { key: 'lineVoid',    header: 'Line void',       render: (r) => formatNumber(r.lineVoid) },
  { key: 'voidAmount',  header: 'Void amount',     render: (r) => formatCurrency(r.voidAmount) },
  { key: 'refunds',     header: 'Refunds',         render: (r) => formatCurrency(r.refunds) },
]

const DEFAULT_VISIBLE_KEYS = ['storeName', 'reportDate', 'groceryTotal', 'volume', 'cashDeposit', 'refunds']

// ── Date presets ───────────────────────────────────────────────────────────

const isoDate = (d) => d.toISOString().slice(0, 10)

const DATE_PRESETS = [
  { value: 'today',      label: 'Today' },
  { value: 'yesterday',  label: 'Yesterday' },
  { value: '7days',      label: 'Last 7 days' },
  { value: '30days',     label: 'Last 30 days' },
  { value: 'month',      label: 'Current month' },
  { value: 'prev_month', label: 'Previous month' },
  { value: 'custom',     label: 'Custom range' },
]

const getPresetRange = (preset) => {
  const t = new Date()
  switch (preset) {
    case 'today':
      return { from: isoDate(t), to: isoDate(t) }
    case 'yesterday': {
      const y = new Date(t - 86400000)
      return { from: isoDate(y), to: isoDate(y) }
    }
    case '7days':
      return { from: isoDate(new Date(t - 6 * 86400000)), to: isoDate(t) }
    case '30days':
      return { from: isoDate(new Date(t - 29 * 86400000)), to: isoDate(t) }
    case 'month':
      return { from: isoDate(new Date(t.getFullYear(), t.getMonth(), 1)), to: isoDate(t) }
    case 'prev_month': {
      const first = new Date(t.getFullYear(), t.getMonth() - 1, 1)
      const last  = new Date(t.getFullYear(), t.getMonth(), 0)
      return { from: isoDate(first), to: isoDate(last) }
    }
    default:
      return { from: '', to: '' }
  }
}

// ── Saved views helpers ────────────────────────────────────────────────────

const SAVED_VIEWS_KEY = 'dr_saved_views'

const loadSavedViews = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]') } catch { return [] }
}

const persistViews = (views) => {
  try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)) } catch {}
}

// ── Statics ────────────────────────────────────────────────────────────────

const initialFormValues = {
  storeId: '', reportDate: '', groceryTotal: '', volume: '',
  cashDeposit: '', checkDeposit: '', overShort: '', noSale: '',
  lineVoid: '', voidAmount: '', refunds: '',
}

const SEARCH_FIELDS = ['storeName', 'reportDate']
const sortByDate = (l, r) => String(r.reportDate).localeCompare(String(l.reportDate))

const numericFields = [
  ['groceryTotal', 'Grocery total'],
  ['volume',       'Volume'],
  ['cashDeposit',  'Cash deposit'],
  ['checkDeposit', 'Check deposit'],
  ['overShort',    'Over short'],
  ['noSale',       'No sale'],
  ['lineVoid',     'Line void'],
  ['voidAmount',   'Void amount'],
  ['refunds',      'Refunds'],
]

// ── SVG icons (inline, no extra deps) ────────────────────────────────────

const IconFilter  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
const IconChevron = ({ open }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`dr-filter-bar__chevron${open ? ' dr-filter-bar__chevron--open' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
const IconColumns = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
const IconTable   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" /></svg>
const IconCards   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="9" height="9" rx="1" /><rect x="13" y="3" width="9" height="9" rx="1" /><rect x="2" y="13" width="9" height="9" rx="1" /><rect x="13" y="13" width="9" height="9" rx="1" /></svg>
const IconSplit   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="3" x2="12" y2="21" /></svg>
const IconEmpty   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" /></svg>

const VIEW_MODES = [
  { value: 'table', label: 'Table', Icon: IconTable },
  { value: 'card',  label: 'Cards', Icon: IconCards },
  { value: 'split', label: 'Split', Icon: IconSplit },
]

// ── Component ──────────────────────────────────────────────────────────────

function DailyReportsPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin } = usePermissions()

  // ── Business state (unchanged) ──────────────────────────────────────────
  const [searchTerm,    setSearchTerm]  = useState('')
  const [filters,       setFilters]     = useState(() => ({ storeId: '', clientId: '', ...getPresetRange('30days') }))
  const [selectedReport, setSelectedReport] = useState(null)
  const [isModalOpen,   setIsModalOpen] = useState(false)
  const [formValues,    setFormValues]  = useState(initialFormValues)
  const [formErrors,    setFormErrors]  = useState({})
  const [submitting,    setSubmitting]  = useState(false)

  // ── UI-only state ───────────────────────────────────────────────────────
  const [viewMode,       setViewMode]       = useState('table')
  const [datePreset,     setDatePreset]     = useState('30days')
  const [visibleKeys,    setVisibleKeys]    = useState(DEFAULT_VISIBLE_KEYS)
  const [columnPanelOpen, setColumnPanelOpen] = useState(false)
  const [columnSearch,   setColumnSearch]  = useState('')
  const [filterOpen,     setFilterOpen]    = useState(false)
  const [savedViews,     setSavedViews]    = useState(loadSavedViews)
  const [saveViewName,   setSaveViewName]  = useState('')
  const [isDetailOpen,   setIsDetailOpen]  = useState(false)
  const [exporting,      setExporting]     = useState(false)

  // ── Queries (unchanged logic) ───────────────────────────────────────────
  const storesQuery = useApi(
    () => (isAdmin ? storeService.getStores() : storeService.getClientStores()),
    { initialData: [] },
  )

  const clientsQuery = useApi(() => clientService.getClients(), {
    auto: isAdmin,
    initialData: [],
  })

  useEffect(() => {
    if (!selectedStoreId && storesQuery.data?.length && !isAdmin) {
      setSelectedStoreId(String(storesQuery.data[0].storeId))
    }
  }, [isAdmin, selectedStoreId, setSelectedStoreId, storesQuery.data])

  const reportsQuery = useApi(
    () => {
      if (isAdmin) return dailyReportService.getAdminReports(filters)
      if (!selectedStoreId) return Promise.resolve([])
      return dailyReportService.getClientReportsByStore(selectedStoreId)
    },
    {
      initialData: [],
      deps: [filters.storeId, filters.clientId, filters.from, filters.to, isAdmin, selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({ type: 'error', title: 'Daily reports load failed', message: details.message })
      },
    },
  )

  // openEditModal declared before tableColumns to avoid TDZ
  const openEditModal = useCallback((report) => {
    setSelectedReport(report)
    setFormValues(
      numericFields.reduce(
        (acc, [field]) => ({ ...acc, [field]: report[field] ?? '' }),
        { storeId: String(report.storeId), reportDate: report.reportDate || '' },
      ),
    )
    setFormErrors({})
    setIsModalOpen(true)
  }, [])

  const storeOptions = useMemo(
    () => (storesQuery.data || []).map((s) => ({ label: s.storeName, value: String(s.storeId) })),
    [storesQuery.data],
  )

  const clientOptions = useMemo(
    () => (clientsQuery.data || []).map((c) => ({ label: c.fullName, value: String(c.clientId) })),
    [clientsQuery.data],
  )

  const uniqueStores = useMemo(
    () => new Set((reportsQuery.data || []).map((r) => r.storeId)).size,
    [reportsQuery.data],
  )

  const visibleColumnDefs = useMemo(
    () => ALL_COLUMNS.filter((c) => visibleKeys.includes(c.key)),
    [visibleKeys],
  )

  const tableColumns = useMemo(() => {
    const cols = visibleColumnDefs.map((col) => ({
      key: col.key,
      header: col.header,
      render: col.render,
    }))
    if (isAdmin) {
      cols.push({
        key: 'actions',
        header: '',
        render: (row) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); openEditModal(row) }}
          >
            Edit
          </Button>
        ),
      })
    }
    return cols
  }, [visibleColumnDefs, isAdmin, openEditModal])

  // Client-side date filter — client API doesn't accept date params
  const clientDateFilterFn = useCallback(
    (row) => {
      const d = row.reportDate || ''
      if (filters.from && d < filters.from) return false
      if (filters.to && d > filters.to) return false
      return true
    },
    [filters.from, filters.to],
  )

  const { page, totalItems, totalPages, pageItems, pageSize, setPage, setPageSize, filteredData } =
    useTable({
      data: reportsQuery.data || [],
      searchTerm,
      searchFields: SEARCH_FIELDS,
      sortFn: sortByDate,
      filterFn: !isAdmin ? clientDateFilterFn : null,
    })

  // ── Event handlers (unchanged business logic) ───────────────────────────

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormValues((v) => ({ ...v, [name]: value }))
  }

  const applyDatePreset = (preset) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      setFilters((f) => ({ ...f, ...getPresetRange(preset) }))
    }
  }

  const resetFilters = () => {
    setDatePreset('30days')
    setFilters({ storeId: '', clientId: '', ...getPresetRange('30days') })
    setSearchTerm('')
  }

  const openCreateModal = () => {
    setSelectedReport(null)
    setFormValues({ ...initialFormValues, storeId: filters.storeId || selectedStoreId || '' })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedReport(null)
    setFormValues(initialFormValues)
    setFormErrors({})
    setIsModalOpen(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateDailyReportForm(formValues)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      const payload = numericFields.reduce(
        (acc, [field]) => ({
          ...acc,
          [field]: formValues[field] === '' ? null : Number(formValues[field]),
        }),
        { storeId: formValues.storeId, reportDate: formValues.reportDate },
      )
      const savedReport = selectedReport
        ? await dailyReportService.updateReport(selectedReport.dailyReportId, payload)
        : await dailyReportService.createReport(payload)
      reportsQuery.setData((current) =>
        !selectedReport
          ? [savedReport, ...(current || [])]
          : (current || []).map((r) => (r.dailyReportId === savedReport.dailyReportId ? savedReport : r)),
      )
      notify({
        type: 'success',
        title: selectedReport ? 'Daily report updated' : 'Daily report created',
        message: `${savedReport.storeName} report for ${savedReport.reportDate} has been saved.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({ type: 'error', title: 'Report save failed', message: details.message })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Column visibility ───────────────────────────────────────────────────

  const toggleColumn = (key) => {
    if (ALL_COLUMNS.find((c) => c.key === key)?.sticky) return
    setVisibleKeys((keys) =>
      keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
    )
  }

  const selectAllColumns = () => setVisibleKeys(ALL_COLUMNS.map((c) => c.key))
  const clearColumns     = () => setVisibleKeys(ALL_COLUMNS.filter((c) => c.sticky).map((c) => c.key))

  // ── Saved views ─────────────────────────────────────────────────────────

  const saveCurrentView = () => {
    const name = saveViewName.trim()
    if (!name) return
    const view = { id: Date.now(), name, columns: visibleKeys, viewMode }
    const next = [...savedViews, view]
    setSavedViews(next)
    persistViews(next)
    setSaveViewName('')
    notify({ type: 'success', title: 'View saved', message: `"${name}" has been saved.` })
  }

  const loadView = (view) => {
    setVisibleKeys(view.columns)
    setViewMode(view.viewMode)
  }

  const deleteView = (id) => {
    const next = savedViews.filter((v) => v.id !== id)
    setSavedViews(next)
    persistViews(next)
  }

  // ── Export ──────────────────────────────────────────────────────────────

  const handleExport = async (format) => {
    if (!filteredData.length) {
      notify({ type: 'error', title: 'Nothing to export', message: 'No records match current filters.' })
      return
    }
    setExporting(true)
    try {
      const exportCols = visibleColumnDefs.map((c) => ({ key: c.key, header: c.header }))
      const matrix = buildExportMatrix(exportCols, filteredData)
      const filename = `daily_reports_${filters.from || 'all'}_to_${filters.to || 'all'}`
      if (format === 'csv')   exportCsv(matrix, filename)
      if (format === 'excel') exportExcel(matrix, filename)
      if (format === 'pdf')
        await exportPdf({
          title: 'Daily Reports',
          subtitle: filters.from ? `${filters.from} to ${filters.to}` : 'All dates',
          matrix,
          chartContainer: null,
        })
    } catch (err) {
      notify({ type: 'error', title: 'Export failed', message: err?.message || 'Could not generate export.' })
    } finally {
      setExporting(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────

  const filteredColumnOptions = useMemo(
    () => ALL_COLUMNS.filter((c) => c.header.toLowerCase().includes(columnSearch.toLowerCase())),
    [columnSearch],
  )

  const metricColumns = visibleColumnDefs.filter((c) => !c.sticky)
  const hasData       = filteredData.length > 0

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="daily-reports-page">
      <PageHeader
        eyebrow={isAdmin ? 'Report module' : 'Client report view'}
        title="Daily reports"
        description="Filter by date, choose columns, switch views, and export reports."
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreateModal}>
              New daily report
            </Button>
          ) : null
        }
      />

      {/* ── Filter bar ── */}
      <div className="dr-filter-bar">
        <div className="dr-filter-bar__header">
          <span className="dr-filter-bar__heading">Filters &amp; display</span>
          <button
            type="button"
            className="dr-filter-bar__toggle"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
          >
            <IconFilter />
            Filters
            <IconChevron open={filterOpen} />
          </button>
        </div>

        <div className={`dr-filter-bar__body${filterOpen ? ' is-open' : ''}`}>
          {/* Filter fields row */}
          <div className="dr-filter-bar__row">
            <div className="dr-filter-bar__field">
              <label className="dr-field-label">Date range</label>
              <select
                className="dr-native-select"
                value={datePreset}
                onChange={(e) => applyDatePreset(e.target.value)}
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {datePreset === 'custom' && (
              <>
                <div className="dr-filter-bar__field dr-filter-bar__field--date">
                  <TextInput label="From" name="from" type="date" value={filters.from} onChange={handleFilterChange} />
                </div>
                <div className="dr-filter-bar__field dr-filter-bar__field--date">
                  <TextInput label="To" name="to" type="date" value={filters.to} onChange={handleFilterChange} />
                </div>
              </>
            )}

            {isAdmin ? (
              <div className="dr-filter-bar__field">
                <SelectInput label="Store" name="storeId" value={filters.storeId} onChange={handleFilterChange} options={storeOptions} placeholder="All stores" />
              </div>
            ) : (
              <div className="dr-filter-bar__field">
                <SelectInput label="Store" name="selectedStoreId" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} options={storeOptions} placeholder="Choose a store" />
              </div>
            )}

            {isAdmin && (
              <div className="dr-filter-bar__field">
                <SelectInput label="Client" name="clientId" value={filters.clientId} onChange={handleFilterChange} options={clientOptions} placeholder="All clients" />
              </div>
            )}

            <div className="dr-filter-bar__field dr-filter-bar__field--grow">
              <TextInput
                label="Search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Store name or date…"
              />
            </div>
          </div>

          {/* Toolbar row */}
          <div className="dr-toolbar">
            {/* Column selector */}
            <div className="dr-column-selector">
              <button
                type="button"
                className={`dr-toolbar-btn${columnPanelOpen ? ' dr-toolbar-btn--active' : ''}`}
                onClick={() => setColumnPanelOpen((o) => !o)}
              >
                <IconColumns />
                Columns
                <span className="dr-toolbar-btn__badge">
                  {visibleKeys.filter((k) => !ALL_COLUMNS.find((c) => c.key === k)?.sticky).length}
                  /{ALL_COLUMNS.filter((c) => !c.sticky).length}
                </span>
              </button>

              {columnPanelOpen && (
                <>
                  <div className="dr-overlay" onClick={() => setColumnPanelOpen(false)} />
                  <div className="dr-column-panel">
                    <div className="dr-column-panel__search">
                      <input
                        type="text"
                        className="dr-column-panel__search-input"
                        placeholder="Search columns…"
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                      />
                    </div>
                    <div className="dr-column-panel__actions">
                      <button type="button" className="dr-column-panel__action-btn" onClick={selectAllColumns}>All</button>
                      <button type="button" className="dr-column-panel__action-btn" onClick={clearColumns}>None</button>
                    </div>
                    <div className="dr-column-panel__list">
                      {filteredColumnOptions.map((col) => (
                        <label
                          key={col.key}
                          className={`dr-column-panel__item${col.sticky ? ' dr-column-panel__item--sticky' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={visibleKeys.includes(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            disabled={col.sticky}
                          />
                          <span className="dr-column-panel__item-label">{col.header}</span>
                          {col.sticky && <span className="dr-column-panel__always">Always</span>}
                        </label>
                      ))}
                    </div>
                    <div className="dr-column-panel__footer">
                      <input
                        type="text"
                        className="dr-column-panel__save-input"
                        placeholder="View name…"
                        value={saveViewName}
                        onChange={(e) => setSaveViewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveCurrentView()}
                      />
                      <button
                        type="button"
                        className="dr-column-panel__save-btn"
                        onClick={saveCurrentView}
                        disabled={!saveViewName.trim()}
                      >
                        Save view
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* View mode */}
            <div className="dr-view-toggle">
              {VIEW_MODES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`dr-view-btn${viewMode === value ? ' dr-view-btn--active' : ''}`}
                  onClick={() => setViewMode(value)}
                  title={label}
                >
                  <Icon />
                  <span className="dr-view-btn__label">{label}</span>
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="dr-export-group">
              <span className="dr-toolbar-label">Export</span>
              {['csv', 'excel', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className="dr-export-btn"
                  disabled={exporting || !hasData}
                  onClick={() => handleExport(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>

            <button type="button" className="dr-toolbar-btn dr-toolbar-btn--ghost" onClick={resetFilters}>
              Reset
            </button>
          </div>

          {/* Saved views strip */}
          {savedViews.length > 0 && (
            <div className="dr-saved-views">
              <span className="dr-saved-views__label">Saved views</span>
              <div className="dr-saved-views__list">
                {savedViews.map((view) => (
                  <span key={view.id} className="dr-saved-views__chip">
                    <button type="button" className="dr-saved-views__chip-name" onClick={() => loadView(view)}>
                      {view.name}
                    </button>
                    <button
                      type="button"
                      className="dr-saved-views__chip-remove"
                      onClick={() => deleteView(view.id)}
                      aria-label={`Remove "${view.name}"`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick stats bar ── */}
      <div className="dr-stats-bar">
        <div className="dr-stats-bar__item">
          <span className="dr-stats-bar__value">{totalItems.toLocaleString()}</span>
          <span className="dr-stats-bar__label">Records</span>
        </div>
        {uniqueStores > 0 && (
          <div className="dr-stats-bar__item">
            <span className="dr-stats-bar__value">{uniqueStores}</span>
            <span className="dr-stats-bar__label">Stores</span>
          </div>
        )}
        {(filters.from || filters.to) && (
          <div className="dr-stats-bar__item">
            <span className="dr-stats-bar__value">
              {filters.from ? formatDate(filters.from) : '—'} – {filters.to ? formatDate(filters.to) : '—'}
            </span>
            <span className="dr-stats-bar__label">Date range</span>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="dr-content">
        <AsyncState
          isLoading={reportsQuery.loading || storesQuery.loading}
          error={reportsQuery.error || storesQuery.error}
          isEmpty={!pageItems.length && !reportsQuery.loading}
          emptyTitle="No reports found"
          emptyDescription="Try adjusting the date range, store, or search filters."
        >
          {/* Table view */}
          {viewMode === 'table' && (
            <>
              <div className="dr-table-shell">
                <DataTable
                  columns={tableColumns}
                  rows={pageItems}
                  keyField="dailyReportId"
                  onRowClick={(row) => { setSelectedReport(row); setIsDetailOpen(true) }}
                />
              </div>
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}

          {/* Card view */}
          {viewMode === 'card' && (
            <>
              <div className="dr-card-grid">
                {pageItems.map((report) => (
                  <div
                    key={report.dailyReportId}
                    className={`dr-report-card${selectedReport?.dailyReportId === report.dailyReportId ? ' dr-report-card--selected' : ''}`}
                    onClick={() => { setSelectedReport(report); setIsDetailOpen(true) }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && (setSelectedReport(report), setIsDetailOpen(true))}
                  >
                    <div className="dr-report-card__header">
                      <span className="dr-report-card__store">{report.storeName}</span>
                      <span className="dr-report-card__date">{formatDate(report.reportDate)}</span>
                    </div>
                    {metricColumns.length > 0 && (
                      <div className="dr-report-card__metrics">
                        {metricColumns.map((col) => (
                          <div key={col.key} className="dr-report-card__metric">
                            <span className="dr-report-card__metric-label">{col.header}</span>
                            <span className="dr-report-card__metric-value">{col.render(report)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="dr-report-card__footer">
                        <button
                          type="button"
                          className="dr-card-edit-btn"
                          onClick={(e) => { e.stopPropagation(); openEditModal(report) }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}

          {/* Split view */}
          {viewMode === 'split' && (
            <div className="dr-split-view">
              <div className="dr-split-view__left">
                <div className="dr-card-grid dr-card-grid--compact">
                  {pageItems.map((report) => (
                    <div
                      key={report.dailyReportId}
                      className={`dr-report-card dr-report-card--compact${selectedReport?.dailyReportId === report.dailyReportId ? ' dr-report-card--selected' : ''}`}
                      onClick={() => setSelectedReport(report)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedReport(report)}
                    >
                      <div className="dr-report-card__header">
                        <span className="dr-report-card__store">{report.storeName}</span>
                        <span className="dr-report-card__date">{formatDate(report.reportDate)}</span>
                      </div>
                      {metricColumns.length > 0 && (
                        <div className="dr-report-card__metrics">
                          {metricColumns.slice(0, 3).map((col) => (
                            <div key={col.key} className="dr-report-card__metric">
                              <span className="dr-report-card__metric-label">{col.header}</span>
                              <span className="dr-report-card__metric-value">{col.render(report)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <PaginationBar
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>

              <div className="dr-split-view__right">
                {selectedReport ? (
                  <div className="dr-detail-panel">
                    <div className="dr-detail-panel__header">
                      <div>
                        <h3 className="dr-detail-panel__store">{selectedReport.storeName}</h3>
                        <span className="dr-detail-panel__date">{formatDate(selectedReport.reportDate)}</span>
                      </div>
                      {isAdmin && (
                        <Button type="button" variant="secondary" size="sm" onClick={() => openEditModal(selectedReport)}>
                          Edit
                        </Button>
                      )}
                    </div>
                    <dl className="detail-list">
                      {numericFields.map(([field, label]) => (
                        <div key={field}>
                          <dt>{label}</dt>
                          <dd>{formatNumber(selectedReport[field])}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : (
                  <div className="dr-detail-panel dr-detail-panel--empty">
                    <IconEmpty />
                    <p>Select a report from the list to see full details.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </AsyncState>
      </div>

      {/* ── Detail modal (table & card views) ── */}
      <Modal
        isOpen={isDetailOpen && viewMode !== 'split'}
        title="Report details"
        onClose={() => setIsDetailOpen(false)}
      >
        {selectedReport && (
          <>
            <div className="dr-detail-modal-header">
              <strong>{selectedReport.storeName}</strong>
              <span>{formatDate(selectedReport.reportDate)}</span>
            </div>
            <dl className="detail-list">
              {numericFields.map(([field, label]) => (
                <div key={field}>
                  <dt>{label}</dt>
                  <dd>{formatNumber(selectedReport[field])}</dd>
                </div>
              ))}
            </dl>
            {isAdmin && (
              <div className="dr-detail-modal-actions">
                <Button
                  type="button"
                  onClick={() => { setIsDetailOpen(false); openEditModal(selectedReport) }}
                >
                  Edit this report
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── Create / Edit modal (admin only — unchanged logic) ── */}
      <Modal
        isOpen={isModalOpen}
        title={selectedReport ? 'Update daily report' : 'Create daily report'}
        onClose={closeModal}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <SelectInput
            label="Store"
            name="storeId"
            value={formValues.storeId}
            onChange={handleFormChange}
            options={storeOptions}
            error={formErrors.storeId}
          />
          <TextInput
            label="Report date"
            name="reportDate"
            type="date"
            value={formValues.reportDate}
            onChange={handleFormChange}
            error={formErrors.reportDate}
          />
          {numericFields.map(([field, label]) => (
            <TextInput
              key={field}
              label={label}
              name={field}
              type="number"
              step="0.01"
              value={formValues[field]}
              onChange={handleFormChange}
              error={formErrors[field]}
            />
          ))}
          <Button type="submit" isLoading={submitting}>
            {selectedReport ? 'Save changes' : 'Create report'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default DailyReportsPage
