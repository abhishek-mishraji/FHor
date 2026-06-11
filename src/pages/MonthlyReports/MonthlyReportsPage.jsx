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
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import clientService from '../../services/clientService'
import monthlyReportService from '../../services/monthlyReportService'
import storeService from '../../services/storeService'
import { formatMonthYear, getMonthOptions, getYearOptions } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { formatCurrency, formatNumber } from '../../utils/numberUtils'
import {
  validateMonthlyReportForm,
  validateMonthlyUploadForm,
} from '../../validations/reportValidation'
import '../../page-styles/MonthlyReports/MonthlyReports.css'

const monthOptions = getMonthOptions()
const yearOptions = getYearOptions(new Date().getFullYear(), 3)

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
  ['gross', 'Gross'],
  ['discount', 'Discount'],
  ['promotion', 'Promotion'],
  ['refund', 'Refund'],
  ['voidAmount', 'Void amount'],
  ['netSales', 'Net sales'],
]

function MonthlyReportsPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin, can } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    storeId: '',
    clientId: '',
    year: '',
    month: '',
  })
  const [selectedReport, setSelectedReport] = useState(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [uploadValues, setUploadValues] = useState(initialUploadValues)
  const [uploadErrors, setUploadErrors] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)

  const storesQuery = useApi(() => (isAdmin ? storeService.getStores() : storeService.getClientStores()), {
    initialData: [],
  })

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
        return monthlyReportService.getAdminReports(filters)
      }

      if (!selectedStoreId) {
        return Promise.resolve([])
      }

      return monthlyReportService.getClientReportsByStore(selectedStoreId)
    },
    {
      initialData: [],
      // Admin filters are applied server-side; client month filtering happens
      // locally, so a month change must not refetch the same store data.
      deps: isAdmin
        ? [filters.storeId, filters.clientId, filters.year, filters.month, isAdmin]
        : [isAdmin, selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({
          type: 'error',
          title: 'Monthly reports load failed',
          message: details.message,
        })
      },
    },
  )

  // Client reports are fetched per store without server-side filters, so the
  // month filter is applied locally. Admin lists arrive already filtered.
  const clientMonthFilter = useCallback(
    (row) => Number(row.reportMonth) === Number(filters.month),
    [filters.month],
  )

  const {
    page,
    totalItems,
    totalPages,
    pageItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTable({
    data: reportsQuery.data || [],
    searchTerm,
    searchFields: SEARCH_FIELDS,
    filterFn: !isAdmin && filters.month ? clientMonthFilter : null,
    sortFn: sortByPeriod,
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

  const openEditModal = useCallback((report) => {
    setSelectedReport(report)
    setFormValues(
      numericFields.reduce(
        (accumulator, [field]) => ({
          ...accumulator,
          [field]: report[field] ?? '',
        }),
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

  const columns = useMemo(
    () => [
      { key: 'storeName', header: 'Store' },
      {
        key: 'period',
        header: 'Period',
        render: (row) => formatMonthYear(row.reportMonth, row.reportYear),
      },
      { key: 'departmentName', header: 'Department', render: (row) => row.departmentName || 'N/A' },
      { key: 'gross', header: 'Gross', render: (row) => formatCurrency(row.gross) },
      { key: 'netSales', header: 'Net sales', render: (row) => formatCurrency(row.netSales) },
      ...(isAdmin
        ? [
            {
              key: 'actions',
              header: 'Actions',
              render: (row) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    openEditModal(row)
                  }}
                >
                  Edit
                </Button>
              ),
            },
          ]
        : []),
    ],
    [isAdmin, openEditModal],
  )

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

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }))
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleUploadChange = (event) => {
    const { name, value, files } = event.target
    setUploadValues((currentValues) => ({
      ...currentValues,
      [name]: files ? files[0] : value,
    }))
  }

  const { setData: setReportsData } = reportsQuery

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateMonthlyReportForm(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      const payload = numericFields.reduce(
        (accumulator, [field]) => ({
          ...accumulator,
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

      setReportsData((currentReports) => {
        if (!selectedReport) {
          return [savedReport, ...(currentReports || [])]
        }

        return (currentReports || []).map((report) =>
          report.monthlyReportId === savedReport.monthlyReportId ? savedReport : report,
        )
      })

      notify({
        type: 'success',
        title: selectedReport ? 'Monthly report updated' : 'Monthly report created',
        message: `${savedReport.storeName} ${formatMonthYear(savedReport.reportMonth, savedReport.reportYear)} has been saved.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Monthly report save failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateMonthlyUploadForm(uploadValues)
    setUploadErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

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
      notify({
        type: 'error',
        title: 'Monthly upload failed',
        message: details.message,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="monthly-reports-page">
      <PageHeader
        eyebrow={isAdmin ? 'Report module' : 'Client report view'}
        title="Monthly reports"
        description="Review departmental monthly sales and upload bulk replacements using the contract-defined Excel format."
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreateModal}>
              New monthly report
            </Button>
          ) : null
        }
      />

      <div className="page-grid page-grid--two">
        <Card title="Monthly report list" subtitle="Search and filter across store, client, month, and year.">
          <div className="toolbar-grid toolbar-grid--wide">
            <TextInput
              label="Search"
              name="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search monthly reports"
            />
            {isAdmin ? (
              <>
                <SelectInput
                  label="Store"
                  name="storeId"
                  value={filters.storeId}
                  onChange={handleFilterChange}
                  options={storeOptions}
                  placeholder="All stores"
                />
                <SelectInput
                  label="Client"
                  name="clientId"
                  value={filters.clientId}
                  onChange={handleFilterChange}
                  options={clientOptions}
                  placeholder="All clients"
                />
                <SelectInput
                  label="Month"
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  options={monthOptions}
                  placeholder="All months"
                />
                <SelectInput
                  label="Year"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  options={yearOptions}
                  placeholder="All years"
                />
              </>
            ) : (
              <>
                <SelectInput
                  label="Store"
                  name="selectedStoreId"
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                  options={storeOptions}
                  placeholder="Choose a store"
                />
                <SelectInput
                  label="Month"
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  options={monthOptions}
                  placeholder="All months"
                />
              </>
            )}
          </div>

          <AsyncState
            isLoading={reportsQuery.loading || storesQuery.loading}
            error={reportsQuery.error || storesQuery.error}
            isEmpty={!reportsQuery.data?.length}
            emptyTitle="No monthly reports found"
            emptyDescription="Adjust your filters or create monthly data for a store."
          >
            <>
              <DataTable
                columns={columns}
                rows={pageItems}
                keyField="monthlyReportId"
                onRowClick={setSelectedReport}
              />
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          </AsyncState>
        </Card>

        <Card title="Selected report" subtitle="View monthly department totals and deductions">
          {selectedReport ? (
            <dl className="detail-list">
              <div>
                <dt>Store</dt>
                <dd>{selectedReport.storeName}</dd>
              </div>
              <div>
                <dt>Period</dt>
                <dd>{formatMonthYear(selectedReport.reportMonth, selectedReport.reportYear)}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{selectedReport.departmentName || 'N/A'}</dd>
              </div>
              {numericFields.map(([field, label]) => (
                <div key={field}>
                  <dt>{label}</dt>
                  <dd>{formatNumber(selectedReport[field])}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>Select a monthly report to inspect its department-level metrics.</p>
          )}
        </Card>
      </div>

      {can('uploadMonthlyReports') ? (
        <Card
          title="Bulk upload"
          subtitle="The backend replaces existing rows for the same store, month, and year during upload."
        >
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
        </Card>
      ) : null}

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
