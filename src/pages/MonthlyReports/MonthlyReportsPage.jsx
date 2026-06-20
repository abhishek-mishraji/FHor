import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import PaginationBar from '../../components/common/PaginationBar'
import SelectInput from '../../components/forms/SelectInput'
import TextInput from '../../components/forms/TextInput'
import FileInput from '../../components/forms/FileInput'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import clientService from '../../services/clientService'
import monthlyReportService from '../../services/monthlyReportService'
import storeService from '../../services/storeService'
import { buildExportMatrix } from '../../utils/analyticsTransforms'
import { formatMonthYear, getMonthOptions, getYearOptions } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { formatCurrency, formatNumber } from '../../utils/numberUtils'
import { exportCsv, exportExcel, exportPdf } from '../../utils/exportUtils'
import {
  validateMonthlyReportForm,
  validateMonthlyUploadForm,
} from '../../validations/reportValidation'
import '../../page-styles/MonthlyReports/MonthlyReports.css'

const monthOptions = getMonthOptions()
const yearOptions = getYearOptions(new Date().getFullYear(), 3)

// ── Column definitions ─────────────────────────────────────────────────────

const ALL_COLUMNS = [
  { key: 'storeName',      header: 'Store',      sticky: true, render: (r) => r.storeName ?? '—' },
  { key: 'period',         header: 'Period',      sticky: true, render: (r) => formatMonthYear(r.reportMonth, r.reportYear) },
  { key: 'departmentName', header: 'Department',  render: (r) => r.departmentName || 'N/A' },
  { key: 'gross',          header: 'Gross',       render: (r) => formatCurrency(r.gross) },
  { key: 'discount',       header: 'Discount',    render: (r) => formatCurrency(r.discount) },
  { key: 'promotion',      header: 'Promotion',   render: (r) => formatCurrency(r.promotion) },
  { key: 'refund',         header: 'Refund',      render: (r) => formatCurrency(r.refund) },
  { key: 'voidAmount',     header: 'Void amount', render: (r) => formatCurrency(r.voidAmount) },
  { key: 'netSales',       header: 'Net sales',   render: (r) => formatCurrency(r.netSales) },
]

const DEFAULT_VISIBLE_KEYS = ['storeName', 'period', 'departmentName', 'gross', 'netSales']

// ── Saved views helpers ────────────────────────────────────────────────────

const SAVED_VIEWS_KEY = 'mr_saved_views'

const loadSavedViews = () => {
  try { return JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]') } catch { return [] }
}

const persistViews = (views) => {
  try { localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views)) } catch {}
}

// ── Statics ────────────────────────────────────────────────────────────────

const initialFormValues = {
  storeId: '',
  reportMonth: '',
  reportYear: '',
  departmentId: '',
  departmentName: '',
  gross: '',
  discount: '',
  promotion: '',
  refund: '',
  voidAmount: '',
  netSales: '',
}

const initialUploadValues = {
  storeId: '',
  reportMonth: '',
  reportYear: '',
  file: null,
}

const SEARCH_FIELDS = ['storeName', 'departmentName', 'reportMonth', 'reportYear']
const sortByPeriod = (left, right) =>
  Number(right.reportYear) - Number(left.reportYear) ||
  Number(right.reportMonth) - Number(left.reportMonth)

const numericFields = [
  ['gross',      'Gross'],
  ['discount',   'Discount'],
  ['promotion',  'Promotion'],
  ['refund',     'Refund'],
  ['voidAmount', 'Void amount'],
  ['netSales',   'Net sales'],
]

// ── SVG icons ─────────────────────────────────────────────────────────────

const IconFilter  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>
const IconChevron = ({ open }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`mr-filter-bar__chevron${open ? ' mr-filter-bar__chevron--open' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
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

function MonthlyReportsPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin, can } = usePermissions()

  // ── Business state ──────────────────────────────────────────────────────
  const [searchTerm,    setSearchTerm]   = useState('')
  const [filters,       setFilters]      = useState({ storeId: '', clientId: '', year: '', month: '' })
  const [selectedReport, setSelectedReport] = useState(null)
  const [formValues,    setFormValues]   = useState(initialFormValues)
  const [formErrors,    setFormErrors]   = useState({})
  const [uploadValues,  setUploadValues] = useState(initialUploadValues)
  const [uploadErrors,  setUploadErrors] = useState({})
  const [isModalOpen,   setIsModalOpen]  = useState(false)
  const [submitting,    setSubmitting]   = useState(false)
  const [uploading,     setUploading]    = useState(false)
  const [fileInputKey,  setFileInputKey] = useState(0)

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
      if (isAdmin) return monthlyReportService.getAdminReports(filters)
      if (!selectedStoreId) return Promise.resolve([])
      return monthlyReportService.getClientReportsByStore(selectedStoreId)
    },
    {
      initialData: [],
      deps: isAdmin
        ? [filters.storeId, filters.clientId, filters.year, filters.month, isAdmin]
        : [isAdmin, selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({ type: 'error', title: 'Monthly reports load failed', message: details.message })
      },
    },
  )

  // openEditModal declared before tableColumns to avoid TDZ
  const openEditModal = useCallback((report) => {
    setSelectedReport(report)
    setFormValues(
      numericFields.reduce(
        (acc, [field]) => ({ ...acc, [field]: report[field] ?? '' }),
        {
          storeId: String(report.storeId),
          reportMonth: String(report.reportMonth),
          reportYear: String(report.reportYear),
          departmentId: report.departmentId ?? '',
          departmentName: report.departmentName ?? '',
        },
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

  // Client reports are fetched per store without server-side filters, so the
  // month filter is applied locally. Admin lists arrive already filtered.
  const clientMonthFilter = useCallback(
    (row) => Number(row.reportMonth) === Number(filters.month),
    [filters.month],
  )

  const { page, totalItems, totalPages, pageItems, pageSize, setPage, setPageSize, filteredData } =
    useTable({
      data: reportsQuery.data || [],
      searchTerm,
      searchFields: SEARCH_FIELDS,
      filterFn: !isAdmin && filters.month ? clientMonthFilter : null,
      sortFn: sortByPeriod,
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

  const handleUploadChange = (event) => {
    const { name, value, files } = event.target
    setUploadValues((v) => ({ ...v, [name]: files ? files[0] : value }))
  }

  const resetFilters = () => {
    setFilters({ storeId: '', clientId: '', year: '', month: '' })
    setSearchTerm('')
  }

  const openCreateModal = () => {
    setSelectedReport(null)
    setFormValues({
      ...initialFormValues,
      storeId: filters.storeId || selectedStoreId || '',
      reportMonth: filters.month || '',
      reportYear: filters.year || '',
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
    const nextErrors = validateMonthlyReportForm(formValues)
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      const payload = numericFields.reduce(
        (acc, [field]) => ({
          ...acc,
          [field]: formValues[field] === '' ? null : Number(formValues[field]),
        }),
        {
          storeId: formValues.storeId,
          reportMonth: Number(formValues.reportMonth),
          reportYear: Number(formValues.reportYear),
          departmentId: formValues.departmentId === '' ? null : formValues.departmentId,
          departmentName: formValues.departmentName || null,
        },
      )
      const savedReport = selectedReport
        ? await monthlyReportService.updateReport(selectedReport.monthlyReportId, payload)
        : await monthlyReportService.createReport(payload)
      setReportsData((current) =>
        !selectedReport
          ? [savedReport, ...(current || [])]
          : (current || []).map((r) =>
              r.monthlyReportId === savedReport.monthlyReportId ? savedReport : r,
            ),
      )
      notify({
        type: 'success',
        title: selectedReport ? 'Monthly report updated' : 'Monthly report created',
        message: `${savedReport.storeName} ${formatMonthYear(savedReport.reportMonth, savedReport.reportYear)} has been saved.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({ type: 'error', title: 'Monthly report save failed', message: details.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateMonthlyUploadForm(uploadValues)
    setUploadErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setUploading(true)
    try {
      const result = await monthlyReportService.uploadReports({
        storeId: uploadValues.storeId,
        reportMonth: Number(uploadValues.reportMonth),
        reportYear: Number(uploadValues.reportYear),
        file: uploadValues.file,
      })
      notify({
        type: 'success',
        title: 'Upload complete',
        message: `Inserted ${result.insertedRows} rows after replacing ${result.deletedRows} existing records.`,
      })
      setUploadValues(initialUploadValues)
      setUploadErrors({})
      setFileInputKey((k) => k + 1)
      reportsQuery.execute()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setUploadErrors(details.fieldErrors)
      notify({ type: 'error', title: 'Monthly upload failed', message: details.message })
    } finally {
      setUploading(false)
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
      const filename = `monthly_reports_${filters.month || 'all'}_${filters.year || 'all'}`
      if (format === 'csv')   exportCsv(matrix, filename)
      if (format === 'excel') exportExcel(matrix, filename)
      if (format === 'pdf')
        await exportPdf({
          title: 'Monthly Reports',
          subtitle:
            filters.month && filters.year
              ? formatMonthYear(filters.month, filters.year)
              : 'All periods',
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
    <div className="monthly-reports-page">
      <PageHeader
        eyebrow={isAdmin ? 'Report module' : 'Client report view'}
        title="Monthly reports"
        description="Review departmental monthly sales, switch views, and export or upload bulk replacements."
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreateModal}>
              New monthly report
            </Button>
          ) : null
        }
      />
            {/* ── Bulk upload (admin only) ── */}
            {can('uploadMonthlyReports') && (
        <div className="mr-upload-box">
          <div className="mr-upload-box__header">
            <span className="mr-upload-box__title">Bulk upload</span>
            <p className="mr-upload-box__subtitle">
              The backend replaces existing rows for the same store, month, and year during upload.
            </p>
          </div>
          <form className="form-grid form-grid--inline" onSubmit={handleUploadSubmit}>
            <SelectInput
              label="Store"
              name="storeId"
              value={uploadValues.storeId}
              onChange={handleUploadChange}
              options={storeOptions}
              error={uploadErrors.storeId}
            />
            <SelectInput
              label="Month"
              name="reportMonth"
              value={uploadValues.reportMonth}
              onChange={handleUploadChange}
              options={monthOptions}
              error={uploadErrors.reportMonth}
            />
            <SelectInput
              label="Year"
              name="reportYear"
              value={uploadValues.reportYear}
              onChange={handleUploadChange}
              options={yearOptions}
              error={uploadErrors.reportYear}
            />
            <FileInput
              key={fileInputKey}
              label="Excel file"
              name="file"
              accept=".xlsx"
              onChange={handleUploadChange}
              error={uploadErrors.file}
            />
            <Button type="submit" isLoading={uploading}>
              Upload replacement batch
            </Button>
          </form>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="mr-filter-bar">
        <div className="mr-filter-bar__header">
          <span className="mr-filter-bar__heading">Filters &amp; display</span>
          <button
            type="button"
            className="mr-filter-bar__toggle"
            onClick={() => setFilterOpen((o) => !o)}
            aria-expanded={filterOpen}
          >
            <IconFilter />
            Filters
            <IconChevron open={filterOpen} />
          </button>
        </div>

        <div className={`mr-filter-bar__body${filterOpen ? ' is-open' : ''}`}>
          {/* Filter fields row */}
          <div className="mr-filter-bar__row">
            <div className="mr-filter-bar__field">
              <SelectInput
                label="Month"
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
                options={monthOptions}
                placeholder="All months"
              />
            </div>

            <div className="mr-filter-bar__field">
              <SelectInput
                label="Year"
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                options={yearOptions}
                placeholder="All years"
              />
            </div>

            {isAdmin ? (
              <div className="mr-filter-bar__field">
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
              <div className="mr-filter-bar__field">
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
              <div className="mr-filter-bar__field">
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

            <div className="mr-filter-bar__field mr-filter-bar__field--grow">
              <TextInput
                label="Search"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Store or department…"
              />
            </div>
          </div>

          {/* Toolbar row */}
          <div className="mr-toolbar">
            {/* Column selector */}
            <div className="mr-column-selector">
              <button
                type="button"
                className={`mr-toolbar-btn${columnPanelOpen ? ' mr-toolbar-btn--active' : ''}`}
                onClick={() => setColumnPanelOpen((o) => !o)}
              >
                <IconColumns />
                Columns
                <span className="mr-toolbar-btn__badge">
                  {visibleKeys.filter((k) => !ALL_COLUMNS.find((c) => c.key === k)?.sticky).length}
                  /{ALL_COLUMNS.filter((c) => !c.sticky).length}
                </span>
              </button>

              {columnPanelOpen && (
                <>
                  <div className="mr-overlay" onClick={() => setColumnPanelOpen(false)} />
                  <div className="mr-column-panel">
                    <div className="mr-column-panel__search">
                      <input
                        type="text"
                        className="mr-column-panel__search-input"
                        placeholder="Search columns…"
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                      />
                    </div>
                    <div className="mr-column-panel__actions">
                      <button type="button" className="mr-column-panel__action-btn" onClick={selectAllColumns}>All</button>
                      <button type="button" className="mr-column-panel__action-btn" onClick={clearColumns}>None</button>
                    </div>
                    <div className="mr-column-panel__list">
                      {filteredColumnOptions.map((col) => (
                        <label
                          key={col.key}
                          className={`mr-column-panel__item${col.sticky ? ' mr-column-panel__item--sticky' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={visibleKeys.includes(col.key)}
                            onChange={() => toggleColumn(col.key)}
                            disabled={col.sticky}
                          />
                          <span className="mr-column-panel__item-label">{col.header}</span>
                          {col.sticky && <span className="mr-column-panel__always">Always</span>}
                        </label>
                      ))}
                    </div>
                    <div className="mr-column-panel__footer">
                      <input
                        type="text"
                        className="mr-column-panel__save-input"
                        placeholder="View name…"
                        value={saveViewName}
                        onChange={(e) => setSaveViewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveCurrentView()}
                      />
                      <button
                        type="button"
                        className="mr-column-panel__save-btn"
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
            <div className="mr-view-toggle">
              {VIEW_MODES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  className={`mr-view-btn${viewMode === value ? ' mr-view-btn--active' : ''}`}
                  onClick={() => setViewMode(value)}
                  title={label}
                >
                  <Icon />
                  <span className="mr-view-btn__label">{label}</span>
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="mr-export-group">
              <span className="mr-toolbar-label">Export</span>
              {['csv', 'excel', 'pdf'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className="mr-export-btn"
                  disabled={exporting || !hasData}
                  onClick={() => handleExport(fmt)}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>

            <button type="button" className="mr-toolbar-btn mr-toolbar-btn--ghost" onClick={resetFilters}>
              Reset
            </button>
          </div>

          {/* Saved views strip */}
          {savedViews.length > 0 && (
            <div className="mr-saved-views">
              <span className="mr-saved-views__label">Saved views</span>
              <div className="mr-saved-views__list">
                {savedViews.map((view) => (
                  <span key={view.id} className="mr-saved-views__chip">
                    <button type="button" className="mr-saved-views__chip-name" onClick={() => loadView(view)}>
                      {view.name}
                    </button>
                    <button
                      type="button"
                      className="mr-saved-views__chip-remove"
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
      <div className="mr-stats-bar">
        <div className="mr-stats-bar__item">
          <span className="mr-stats-bar__value">{totalItems.toLocaleString()}</span>
          <span className="mr-stats-bar__label">Records</span>
        </div>
        {uniqueStores > 0 && (
          <div className="mr-stats-bar__item">
            <span className="mr-stats-bar__value">{uniqueStores}</span>
            <span className="mr-stats-bar__label">Stores</span>
          </div>
        )}
        {(filters.month || filters.year) && (
          <div className="mr-stats-bar__item">
            <span className="mr-stats-bar__value">
              {filters.month && filters.year
                ? formatMonthYear(filters.month, filters.year)
                : filters.year || `Month ${filters.month}`}
            </span>
            <span className="mr-stats-bar__label">Period filter</span>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="mr-content">
        <AsyncState
          isLoading={reportsQuery.loading || storesQuery.loading}
          error={reportsQuery.error || storesQuery.error}
          isEmpty={!pageItems.length && !reportsQuery.loading}
          emptyTitle="No reports found"
          emptyDescription="Try adjusting the month, year, store, or search filters."
        >
          {/* Table view */}
          {viewMode === 'table' && (
            <>
              <div className="mr-table-shell">
                <DataTable
                  columns={tableColumns}
                  rows={pageItems}
                  keyField="monthlyReportId"
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
              <div className="mr-card-grid">
                {pageItems.map((report) => (
                  <div
                    key={report.monthlyReportId}
                    className={`mr-report-card${selectedReport?.monthlyReportId === report.monthlyReportId ? ' mr-report-card--selected' : ''}`}
                    onClick={() => { setSelectedReport(report); setIsDetailOpen(true) }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && (setSelectedReport(report), setIsDetailOpen(true))}
                  >
                    <div className="mr-report-card__header">
                      <span className="mr-report-card__store">{report.storeName}</span>
                      <span className="mr-report-card__date">{formatMonthYear(report.reportMonth, report.reportYear)}</span>
                    </div>
                    {report.departmentName && (
                      <span className="mr-report-card__dept">{report.departmentName}</span>
                    )}
                    {metricColumns.length > 0 && (
                      <div className="mr-report-card__metrics">
                        {metricColumns.map((col) => (
                          <div key={col.key} className="mr-report-card__metric">
                            <span className="mr-report-card__metric-label">{col.header}</span>
                            <span className="mr-report-card__metric-value">{col.render(report)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mr-report-card__footer">
                        <button
                          type="button"
                          className="mr-card-edit-btn"
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
            <div className="mr-split-view">
              <div className="mr-split-view__left">
                <div className="mr-card-grid mr-card-grid--compact">
                  {pageItems.map((report) => (
                    <div
                      key={report.monthlyReportId}
                      className={`mr-report-card mr-report-card--compact${selectedReport?.monthlyReportId === report.monthlyReportId ? ' mr-report-card--selected' : ''}`}
                      onClick={() => setSelectedReport(report)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedReport(report)}
                    >
                      <div className="mr-report-card__header">
                        <span className="mr-report-card__store">{report.storeName}</span>
                        <span className="mr-report-card__date">{formatMonthYear(report.reportMonth, report.reportYear)}</span>
                      </div>
                      {metricColumns.length > 0 && (
                        <div className="mr-report-card__metrics">
                          {metricColumns.slice(0, 3).map((col) => (
                            <div key={col.key} className="mr-report-card__metric">
                              <span className="mr-report-card__metric-label">{col.header}</span>
                              <span className="mr-report-card__metric-value">{col.render(report)}</span>
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

              <div className="mr-split-view__right">
                {selectedReport ? (
                  <div className="mr-detail-panel">
                    <div className="mr-detail-panel__header">
                      <div>
                        <h3 className="mr-detail-panel__store">{selectedReport.storeName}</h3>
                        <span className="mr-detail-panel__date">
                          {formatMonthYear(selectedReport.reportMonth, selectedReport.reportYear)}
                          {selectedReport.departmentName && ` · ${selectedReport.departmentName}`}
                        </span>
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
                  <div className="mr-detail-panel mr-detail-panel--empty">
                    <IconEmpty />
                    <p>Select a report from the list to see full details.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </AsyncState>
      </div>

      {/* ── Bulk upload (admin only) ── */}
      

      {/* ── Detail modal (table & card views) ── */}
      <Modal
        isOpen={isDetailOpen && viewMode !== 'split'}
        title="Report details"
        onClose={() => setIsDetailOpen(false)}
      >
        {selectedReport && (
          <>
            <div className="mr-detail-modal-header">
              <strong>{selectedReport.storeName}</strong>
              <span>{formatMonthYear(selectedReport.reportMonth, selectedReport.reportYear)}</span>
            </div>
            {selectedReport.departmentName && (
              <p className="mr-detail-modal-dept">{selectedReport.departmentName}</p>
            )}
            <dl className="detail-list">
              {numericFields.map(([field, label]) => (
                <div key={field}>
                  <dt>{label}</dt>
                  <dd>{formatNumber(selectedReport[field])}</dd>
                </div>
              ))}
            </dl>
            {isAdmin && (
              <div className="mr-detail-modal-actions">
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
        title={selectedReport ? 'Update monthly report' : 'Create monthly report'}
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
            label="Month"
            name="reportMonth"
            value={formValues.reportMonth}
            onChange={handleFormChange}
            options={monthOptions}
            error={formErrors.reportMonth}
          />
          <SelectInput
            label="Year"
            name="reportYear"
            value={formValues.reportYear}
            onChange={handleFormChange}
            options={yearOptions}
            error={formErrors.reportYear}
          />
          <TextInput
            label="Department ID"
            name="departmentId"
            type="number"
            value={formValues.departmentId}
            onChange={handleFormChange}
            error={formErrors.departmentId}
          />
          <TextInput
            label="Department name"
            name="departmentName"
            value={formValues.departmentName}
            onChange={handleFormChange}
            error={formErrors.departmentName}
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

export default MonthlyReportsPage
