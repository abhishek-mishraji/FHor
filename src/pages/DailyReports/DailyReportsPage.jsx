import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import PaginationBar from '../../components/common/PaginationBar'
import SelectInput from '../../components/forms/SelectInput'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import dailyReportService from '../../services/dailyReportService'
import clientService from '../../services/clientService'
import storeService from '../../services/storeService'
import { formatDate } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { formatCurrency, formatNumber } from '../../utils/numberUtils'
import { validateDailyReportForm } from '../../validations/reportValidation'
import '../../page-styles/DailyReports/DailyReports.css'

const initialFormValues = {
  storeId: '',
  reportDate: '',
  groceryTotal: '',
  volume: '',
  cashDeposit: '',
  checkDeposit: '',
  overShort: '',
  noSale: '',
  lineVoid: '',
  voidAmount: '',
  refunds: '',
}

const SEARCH_FIELDS = ['storeName', 'reportDate']
const sortByDate = (left, right) =>
  String(right.reportDate).localeCompare(String(left.reportDate))

const numericFields = [
  ['groceryTotal', 'Grocery total'],
  ['volume', 'Volume'],
  ['cashDeposit', 'Cash deposit'],
  ['checkDeposit', 'Check deposit'],
  ['overShort', 'Over short'],
  ['noSale', 'No sale'],
  ['lineVoid', 'Line void'],
  ['voidAmount', 'Void amount'],
  ['refunds', 'Refunds'],
]

function DailyReportsPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    storeId: '',
    clientId: '',
    from: '',
    to: '',
  })
  const [selectedReport, setSelectedReport] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
        return dailyReportService.getAdminReports(filters)
      }

      if (!selectedStoreId) {
        return Promise.resolve([])
      }

      return dailyReportService.getClientReportsByStore(selectedStoreId)
    },
    {
      initialData: [],
      deps: [filters.storeId, filters.clientId, filters.from, filters.to, isAdmin, selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({
          type: 'error',
          title: 'Daily reports load failed',
          message: details.message,
        })
      },
    },
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
    sortFn: sortByDate,
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
          reportDate: report.reportDate || '',
        },
      ),
    )
    setFormErrors({})
    setIsModalOpen(true)
  }, [])

  const columns = useMemo(
    () => [
      { key: 'storeName', header: 'Store' },
      { key: 'reportDate', header: 'Report date', render: (row) => formatDate(row.reportDate) },
      { key: 'groceryTotal', header: 'Grocery', render: (row) => formatCurrency(row.groceryTotal) },
      { key: 'volume', header: 'Volume', render: (row) => formatNumber(row.volume) },
      { key: 'cashDeposit', header: 'Cash', render: (row) => formatCurrency(row.cashDeposit) },
      { key: 'refunds', header: 'Refunds', render: (row) => formatCurrency(row.refunds) },
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

  const openCreateModal = () => {
    setSelectedReport(null)
    setFormValues({
      ...initialFormValues,
      storeId: filters.storeId || selectedStoreId || '',
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

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateDailyReportForm(formValues)
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
          storeId: Number(formValues.storeId),
          reportDate: formValues.reportDate,
        },
      )

      const savedReport = selectedReport
        ? await dailyReportService.updateReport(selectedReport.dailyReportId, payload)
        : await dailyReportService.createReport(payload)

      reportsQuery.setData((currentReports) => {
        if (!selectedReport) {
          return [savedReport, ...(currentReports || [])]
        }

        return (currentReports || []).map((report) =>
          report.dailyReportId === savedReport.dailyReportId ? savedReport : report,
        )
      })

      notify({
        type: 'success',
        title: selectedReport ? 'Daily report updated' : 'Daily report created',
        message: `${savedReport.storeName} report for ${savedReport.reportDate} has been saved.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Report save failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="daily-reports-page">
      <PageHeader
        eyebrow={isAdmin ? 'Report module' : 'Client report view'}
        title="Daily reports"
        description="Track store-level daily retail performance with filtering, search, and update-safe forms."
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreateModal}>
              New daily report
            </Button>
          ) : null
        }
      />

      <div className="page-grid page-grid--two">
        <Card title="Report list" subtitle="Filter by store, date range, and membership context.">
          <div className="toolbar-grid toolbar-grid--wide">
            <TextInput
              label="Search"
              name="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search daily reports"
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
                <TextInput label="From" name="from" type="date" value={filters.from} onChange={handleFilterChange} />
                <TextInput label="To" name="to" type="date" value={filters.to} onChange={handleFilterChange} />
              </>
            ) : (
              <SelectInput
                label="Store"
                name="selectedStoreId"
                value={selectedStoreId}
                onChange={(event) => setSelectedStoreId(event.target.value)}
                options={storeOptions}
                placeholder="Choose a store"
              />
            )}
          </div>

          <AsyncState
            isLoading={reportsQuery.loading || storesQuery.loading}
            error={reportsQuery.error || storesQuery.error}
            isEmpty={!reportsQuery.data?.length}
            emptyTitle="No daily reports found"
            emptyDescription="Adjust your filters or create the first daily report for a store."
          >
            <>
              <DataTable
                columns={columns}
                rows={pageItems}
                keyField="dailyReportId"
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

        <Card title="Selected report" subtitle="Detailed values for the current daily record">
          {selectedReport ? (
            <dl className="detail-list">
              <div>
                <dt>Store</dt>
                <dd>{selectedReport.storeName}</dd>
              </div>
              <div>
                <dt>Report date</dt>
                <dd>{formatDate(selectedReport.reportDate)}</dd>
              </div>
              {numericFields.map(([field, label]) => (
                <div key={field}>
                  <dt>{label}</dt>
                  <dd>{formatNumber(selectedReport[field])}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>Select a daily report row to inspect its metrics.</p>
          )}
        </Card>
      </div>

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
