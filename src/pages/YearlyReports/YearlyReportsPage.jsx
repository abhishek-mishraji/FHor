import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import PaginationBar from '../../components/common/PaginationBar'
import MultiSelectInput from '../../components/forms/MultiSelectInput'
import SelectInput from '../../components/forms/SelectInput'
import TextAreaInput from '../../components/forms/TextAreaInput'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import clientService from '../../services/clientService'
import storeService from '../../services/storeService'
import yearlyReportService from '../../services/yearlyReportService'
import { buildExportMatrix } from '../../utils/analyticsTransforms'
import { getYearOptions } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { exportCsv, exportExcel, exportPdf } from '../../utils/exportUtils'
import { validateYearlyReportForm } from '../../validations/reportValidation'
import '../../page-styles/YearlyReports/YearlyReports.css'

const yearOptions = getYearOptions(new Date().getFullYear(), 4)

// ── Column definitions ─────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: 'storeName',     header: 'Store',          sticky: true, render: (r) => r.storeName ?? '—' },
  { key: 'reportYear',    header: 'Year',            sticky: true, render: (r) => r.reportYear ?? '—' },
  { key: 'annualSummary', header: 'Annual summary',  render: (r) => r.annualSummary || 'No summary provided' },
]

const DEFAULT_VISIBLE_KEYS = ['storeName', 'reportYear', 'annualSummary']

// ── Saved views helpers ────────────────────────────────────────────────────

const SAVED_VIEWS_KEY = 'yr_saved_views'

const loadSavedViews = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]') } catch { return [] }
}

const persistViews = (views) => {
  try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)) } catch {}
}

// ── Statics ────────────────────────────────────────────────────────────────

const initialFormValues = {
  storeId: '',
  reportYear: '',
  annualSummary: '',
}

const SEARCH_FIELDS = ['storeName', 'reportYear', 'annualSummary']
const sortByYear = (left, right) => Number(right.reportYear) - Number(left.reportYear)

// ── SVG icons ─────────────────────────────────────────────────────────────

const IconFilter  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
const IconChevron = ({ open }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`yr-filter-bar__chevron${open ? ' yr-filter-bar__chevron--open' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
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

function YearlyReportsPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin } = usePermissions()

  // ── Business state ──────────────────────────────────────────────────────
  const [searchTerm,     setSearchTerm]    = useState('')
  const [filters,        setFilters]       = useState({ storeId: '', clientId: '', years: [] })
  const [selectedReport, setSelectedReport] = useState(null)
  const [formValues,     setFormValues]    = useState(initialFormValues)
  const [formErrors,     setFormErrors]    = useState({})
  const [isModalOpen,    setIsModalOpen]   = useState(false)
  const [submitting,     setSubmitting]    = useState(false)

  // ── UI-only state ───────────────────────────────────────────────────────
  const [viewMode,        setViewMode]        = useState('table')
  const [visibleKeys,     setVisibleKeys]     = useState(DEFAULT_VISIBLE_KEYS)
  const [columnPanelOpen, setColumnPanelOpen] = useState(false)
  const [columnSearch,    setColumnSearch]    = useState('')
  const [filterOpen,      setFilterOpen]      = useState(false)
  const [savedViews,      setSavedViews]      = useState(loadSavedViews)
  const [saveViewName,    setSaveViewName]    = useState('')
  const [isDetailOpen,    setIsDetailOpen]    = useState(false)
  const [exporting,       setExporting]       = useState(false)

  // ── Queries ─────────────────────────────────────────────────────────────
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
      if (isAdmin) {
        // The backend year filter still accepts a single value, so it's only
        // sent when exactly one year is checked; multi-year selections are
        // narrowed client-side below (yearsFilterFn) without touching the API.
        return yearlyReportService.getAdminReports({
          storeId: filters.storeId,
          clientId: filters.clientId,
          year: filters.years.length === 1 ? filters.years[0] : '',
        })
      }
      if (!selectedStoreId) return Promise.resolve([])
      return yearlyReportService.getClientReportsByStore(selectedStoreId)
    },
    {
      initialData: [],
      deps: [filters.storeId, filters.clientId, filters.years, isAdmin, selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({ type: 'error', title: 'Yearly reports load failed', message: details.message })
      },
    },
  )

  // openEditModal declared before tableColumns to avoid TDZ
  const openEditModal = useCallback((report) => {
    setSelectedReport(report)
    setFormValues({
      storeId: String(report.storeId),
      reportYear: String(report.reportYear),
      annualSummary: report.annualSummary || '',
    })
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

  // Store owner lookup for the PDF export's Client/Store grouping — display only.
  const storeMetaById = useMemo(
    () =>
      Object.fromEntries(
        (storesQuery.data || []).map((s) => [
          String(s.storeId),
          { storeName: s.storeName, ownerName: s.clientName },
        ]),
      ),
    [storesQuery.data],
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

  // Client reports are fetched per store without server-side year filters,
  // and the admin API only narrows by a single year (see reportsQuery above),
  // so multi-year selections are always applied locally for both roles.
  const yearsFilterFn = useCallback(
    (row) => filters.years.includes(Number(row.reportYear)),
    [filters.years],
  )

  const { page, totalItems, totalPages, pageItems, pageSize, setPage, setPageSize, filteredData } =
    useTable({
      data: reportsQuery.data || [],
      searchTerm,
      searchFields: SEARCH_FIELDS,
      filterFn: filters.years.length ? yearsFilterFn : null,
      sortFn: sortByYear,
    })

  // ── Event handlers ──────────────────────────────────────────────────────

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormValues((v) => ({ ...v, [name]: value }))
  }

  const resetFilters = () => {
    setFilters({ storeId: '', clientId: '', years: [] })
    setSearchTerm('')
  }

  const openCreateModal = () => {
    setSelectedReport(null)
    setFormValues({
      ...initialFormValues,
      storeId: filters.storeId || selectedStoreId || '',
      reportYear: filters.years.length === 1 ? String(filters.years[0]) : '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedReport(null)
    setFormValues(initialFormValues)
    setFormErrors({})
    setIsModalOpen(false)
  }

  const { setData: setReportsData } = reportsQuery

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateYearlyReportForm(formValues)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      const payload = {
        storeId: formValues.storeId,
        reportYear: Number(formValues.reportYear),
        annualSummary: formValues.annualSummary || null,
      }
      const savedReport = selectedReport
        ? await yearlyReportService.updateReport(selectedReport.yearlyReportId, payload)
        : await yearlyReportService.createReport(payload)
      setReportsData((current) =>
        !selectedReport
          ? [savedReport, ...(current || [])]
          : (current || []).map((r) =>
              r.yearlyReportId === savedReport.yearlyReportId ? savedReport : r,
            ),
      )
      notify({
        type: 'success',
        title: selectedReport ? 'Yearly report updated' : 'Yearly report created',
        message: `${savedReport.storeName} ${savedReport.reportYear} summary has been saved.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({ type: 'error', title: 'Yearly report save failed', message: details.message })
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
      const filename = `yearly_reports_${filters.years.length ? filters.years.join('-') : 'all'}`
      if (format === 'csv')   exportCsv(matrix, filename)
      if (format === 'excel') exportExcel(matrix, filename)
      if (format === 'pdf')
        await exportPdf({
          title: 'Yearly Reports',
          subtitle: filters.years.length
            ? filters.years.length === 1
              ? String(filters.years[0])
              : `${filters.years.length} years selected`
            : 'All years',
          matrix,
          chartContainer: null,
          reportType: 'Yearly',
          rows: filteredData,
          columns: visibleColumnDefs,
          storeMeta: storeMetaById,
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

  const hasData = filteredData.length > 0

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="yearly-reports-page">
      <PageHeader
        eyebrow={isAdmin ? 'Report module' : 'Client report view'}
        title="Yearly reports"
        description="Capture annual narratives and retrieve year-based summaries across the store portfolio."
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreateModal}>
              New yearly report
            </Button>
          ) : null
        }
      />

      {/* ── Filter bar ── */}
      <div className="yr-filter-bar">
        <div className="yr-filter-bar__header">
          <span className="yr-filter-bar__heading">Filters &amp; display</span>
          <button
            type="button"
            className="yr-filter-bar__toggle"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
          >
            <IconFilter />
            Filters
            <IconChevron open={filterOpen} />
          </button>
        </div>

        <div className={`yr-filter-bar__body${filterOpen ? ' is-open' : ''}`}>
          {/* Filter fields row */}
          <div className="yr-filter-bar__row">
            <div className="yr-filter-bar__field">
              <MultiSelectInput
                label="Year"
                name="years"
                values={filters.years}
                onChange={handleFilterChange}
                options={yearOptions}
                placeholder="All years"
                unitLabel="Year"
                showChips
              />
            </div>

            {isAdmin ? (
              <div className="yr-filter-bar__field">
                <SelectInput
                  label="Store"
                  name="storeId"
                  value={filters.storeId}
                  onChange={handleFilterChange}
                  options={storeOptions}
                  placeholder="All stores"
                />
              </div>
            ) : (
              <div className="yr-filter-bar__field">
                <SelectInput
                  label="Store"
                  name="selectedStoreId"
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  options={storeOptions}
                  placeholder="Choose a store"
                />
              </div>
            )}

            {isAdmin && (
              <div className="yr-filter-bar__field">
                <SelectInput
                  label="Client"
                  name="clientId"
                  value={filters.clientId}
                  onChange={handleFilterChange}
                  options={clientOptions}
                  placeholder="All clients"
                />
              </div>
            )}

            <div className="yr-filter-bar__field yr-filter-bar__field--grow">
              <TextInput
                label="Search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Store, year, or summary…"
              />
            </div>
          </div>

          {/* Toolbar row */}
          <div className="yr-toolbar">
            {/* Column selector */}
            <div className="yr-column-selector">
              <button
                type="button"
                className={`yr-toolbar-btn${columnPanelOpen ? ' yr-toolbar-btn--active' : ''}`}
                onClick={() => setColumnPanelOpen((o) => !o)}
              >
                <IconColumns />
                Columns
                <span className="yr-toolbar-btn__badge">
                  {visibleKeys.filter((k) => !ALL_COLUMNS.find((c) => c.key === k)?.sticky).length}
                  /{ALL_COLUMNS.filter((c) => !c.sticky).length}
                </span>
              </button>

              {columnPanelOpen && (
                <>
                  <div className="yr-overlay" onClick={() => setColumnPanelOpen(false)} />
                  <div className="yr-column-panel">
                    <div className="yr-column-panel__search">
                      <input
                        type="text"
                        className="yr-column-panel__search-input"
                        placeholder="Search columns…"
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                      />
                    </div>
                    <div className="yr-column-panel__actions">
                      <button type="button" className="yr-column-panel__action-btn" onClick={selectAllColumns}>All</button>
                      <button type="button" className="yr-column-panel__action-btn" onClick={clearColumns}>None</button>
                    </div>
                    <div className="yr-column-panel__list">
                      {filteredColumnOptions.map((col) => (
                        <label
                          key={col.key}
                          className={`yr-column-panel__item${col.sticky ? ' yr-column-panel__item--sticky' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={visibleKeys.includes(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            disabled={col.sticky}
                          />
                          <span className="yr-column-panel__item-label">{col.header}</span>
                          {col.sticky && <span className="yr-column-panel__always">Always</span>}
                        </label>
                      ))}
                    </div>
                    <div className="yr-column-panel__footer">
                      <input
                        type="text"
                        className="yr-column-panel__save-input"
                        placeholder="View name…"
                        value={saveViewName}
                        onChange={(e) => setSaveViewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveCurrentView()}
                      />
                      <button
                        type="button"
                        className="yr-column-panel__save-btn"
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
            <div className="yr-view-toggle">
              {VIEW_MODES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`yr-view-btn${viewMode === value ? ' yr-view-btn--active' : ''}`}
                  onClick={() => setViewMode(value)}
                  title={label}
                >
                  <Icon />
                  <span className="yr-view-btn__label">{label}</span>
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="yr-export-group">
              <span className="yr-toolbar-label">Export</span>
              {['csv', 'excel', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className="yr-export-btn"
                  disabled={exporting || !hasData}
                  onClick={() => handleExport(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>

            <button type="button" className="yr-toolbar-btn yr-toolbar-btn--ghost" onClick={resetFilters}>
              Reset
            </button>
          </div>

          {/* Saved views strip */}
          {savedViews.length > 0 && (
            <div className="yr-saved-views">
              <span className="yr-saved-views__label">Saved views</span>
              <div className="yr-saved-views__list">
                {savedViews.map((view) => (
                  <span key={view.id} className="yr-saved-views__chip">
                    <button type="button" className="yr-saved-views__chip-name" onClick={() => loadView(view)}>
                      {view.name}
                    </button>
                    <button
                      type="button"
                      className="yr-saved-views__chip-remove"
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
      <div className="yr-stats-bar">
        <div className="yr-stats-bar__item">
          <span className="yr-stats-bar__value">{totalItems.toLocaleString()}</span>
          <span className="yr-stats-bar__label">Records</span>
        </div>
        {uniqueStores > 0 && (
          <div className="yr-stats-bar__item">
            <span className="yr-stats-bar__value">{uniqueStores}</span>
            <span className="yr-stats-bar__label">Stores</span>
          </div>
        )}
        {filters.years.length > 0 && (
          <div className="yr-stats-bar__item">
            <span className="yr-stats-bar__value">
              {filters.years.length === 1 ? filters.years[0] : `${filters.years.length} years`}
            </span>
            <span className="yr-stats-bar__label">Year filter</span>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="yr-content">
        <AsyncState
          isLoading={reportsQuery.loading || storesQuery.loading}
          error={reportsQuery.error || storesQuery.error}
          isEmpty={!pageItems.length && !reportsQuery.loading}
          emptyTitle="No yearly reports found"
          emptyDescription="Try adjusting the year, store, or search filters."
        >
          {/* Table view */}
          {viewMode === 'table' && (
            <>
              <div className="yr-table-shell">
                <DataTable
                  columns={tableColumns}
                  rows={pageItems}
                  keyField="yearlyReportId"
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
              <div className="yr-card-grid">
                {pageItems.map((report) => (
                  <div
                    key={report.yearlyReportId}
                    className={`yr-report-card${selectedReport?.yearlyReportId === report.yearlyReportId ? ' yr-report-card--selected' : ''}`}
                    onClick={() => { setSelectedReport(report); setIsDetailOpen(true) }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && (setSelectedReport(report), setIsDetailOpen(true))}
                  >
                    <div className="yr-report-card__header">
                      <span className="yr-report-card__store">{report.storeName}</span>
                      <span className="yr-report-card__year">{report.reportYear}</span>
                    </div>
                    <p className="yr-report-card__summary">
                      {report.annualSummary || 'No summary provided'}
                    </p>
                    {isAdmin && (
                      <div className="yr-report-card__footer">
                        <button
                          type="button"
                          className="yr-card-edit-btn"
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
            <div className="yr-split-view">
              <div className="yr-split-view__left">
                <div className="yr-card-grid yr-card-grid--compact">
                  {pageItems.map((report) => (
                    <div
                      key={report.yearlyReportId}
                      className={`yr-report-card yr-report-card--compact${selectedReport?.yearlyReportId === report.yearlyReportId ? ' yr-report-card--selected' : ''}`}
                      onClick={() => setSelectedReport(report)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedReport(report)}
                    >
                      <div className="yr-report-card__header">
                        <span className="yr-report-card__store">{report.storeName}</span>
                        <span className="yr-report-card__year">{report.reportYear}</span>
                      </div>
                      {report.annualSummary && (
                        <p className="yr-report-card__summary yr-report-card__summary--clamp">
                          {report.annualSummary}
                        </p>
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

              <div className="yr-split-view__right">
                {selectedReport ? (
                  <div className="yr-detail-panel">
                    <div className="yr-detail-panel__header">
                      <div>
                        <h3 className="yr-detail-panel__store">{selectedReport.storeName}</h3>
                        <span className="yr-detail-panel__year">{selectedReport.reportYear}</span>
                      </div>
                      {isAdmin && (
                        <Button type="button" variant="secondary" size="sm" onClick={() => openEditModal(selectedReport)}>
                          Edit
                        </Button>
                      )}
                    </div>
                    <div className="yr-detail-panel__body">
                      <p className="yr-detail-panel__label">Annual summary</p>
                      <p className="yr-detail-panel__text">
                        {selectedReport.annualSummary || 'No summary provided'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="yr-detail-panel yr-detail-panel--empty">
                    <IconEmpty />
                    <p>Select a report from the list to read its annual summary.</p>
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
            <div className="yr-detail-modal-header">
              <strong>{selectedReport.storeName}</strong>
              <span>{selectedReport.reportYear}</span>
            </div>
            <p className="yr-detail-modal-label">Annual summary</p>
            <p className="yr-detail-modal-text">
              {selectedReport.annualSummary || 'No summary provided'}
            </p>
            {isAdmin && (
              <div className="yr-detail-modal-actions">
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

      {/* ── Create / Edit modal ── */}
      <Modal
        isOpen={isModalOpen}
        title={selectedReport ? 'Update yearly report' : 'Create yearly report'}
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
          <SelectInput
            label="Report year"
            name="reportYear"
            value={formValues.reportYear}
            onChange={handleFormChange}
            options={yearOptions}
            error={formErrors.reportYear}
          />
          <TextAreaInput
            label="Annual summary"
            name="annualSummary"
            value={formValues.annualSummary}
            onChange={handleFormChange}
            error={formErrors.annualSummary}
            rows={6}
          />
          <Button type="submit" isLoading={submitting}>
            {selectedReport ? 'Save changes' : 'Create report'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default YearlyReportsPage
