import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import PaginationBar from '../../components/common/PaginationBar'
import SelectInput from '../../components/forms/SelectInput'
import TextAreaInput from '../../components/forms/TextAreaInput'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import clientService from '../../services/clientService'
import storeService from '../../services/storeService'
import yearlyReportService from '../../services/yearlyReportService'
import { getYearOptions } from '../../utils/dateUtils'
import { handleServiceError } from '../../utils/errorHandler'
import { validateYearlyReportForm } from '../../validations/reportValidation'
import '../../page-styles/YearlyReports/YearlyReports.css'

const yearOptions = getYearOptions(new Date().getFullYear(), 4)

const SEARCH_FIELDS = ['storeName', 'reportYear', 'annualSummary']
const sortByYear = (left, right) => Number(right.reportYear) - Number(left.reportYear)

const initialFormValues = {
  storeId: '',
  reportYear: '',
  annualSummary: '',
}

function YearlyReportsPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    storeId: '',
    clientId: '',
    year: '',
  })
  const [selectedReport, setSelectedReport] = useState(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        return yearlyReportService.getAdminReports(filters)
      }

      if (!selectedStoreId) {
        return Promise.resolve([])
      }

      return yearlyReportService.getClientReportsByStore(selectedStoreId)
    },
    {
      initialData: [],
      deps: [filters.storeId, filters.clientId, filters.year, isAdmin, selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({
          type: 'error',
          title: 'Yearly reports load failed',
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
    sortFn: sortByYear,
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
    setFormValues({
      storeId: String(report.storeId),
      reportYear: String(report.reportYear),
      annualSummary: report.annualSummary || '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }, [])

  const columns = useMemo(
    () => [
      { key: 'storeName', header: 'Store' },
      { key: 'reportYear', header: 'Year' },
      {
        key: 'annualSummary',
        header: 'Summary',
        render: (row) => row.annualSummary || 'No summary provided',
      },
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

    const nextErrors = validateYearlyReportForm(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        storeId: Number(formValues.storeId),
        reportYear: Number(formValues.reportYear),
        annualSummary: formValues.annualSummary || null,
      }

      const savedReport = selectedReport
        ? await yearlyReportService.updateReport(selectedReport.yearlyReportId, payload)
        : await yearlyReportService.createReport(payload)

      setReportsData((currentReports) => {
        if (!selectedReport) {
          return [savedReport, ...(currentReports || [])]
        }

        return (currentReports || []).map((report) =>
          report.yearlyReportId === savedReport.yearlyReportId ? savedReport : report,
        )
      })

      notify({
        type: 'success',
        title: selectedReport ? 'Yearly report updated' : 'Yearly report created',
        message: `${savedReport.storeName} ${savedReport.reportYear} summary has been saved.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Yearly report save failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

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

      <div className="page-grid page-grid--two">
        <Card title="Yearly report list" subtitle="Filter by store, year, and related client ownership.">
          <div className="toolbar-grid toolbar-grid--wide">
            <TextInput
              label="Search"
              name="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search yearly reports"
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
                  label="Year"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  options={yearOptions}
                  placeholder="All years"
                />
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
            emptyTitle="No yearly reports found"
            emptyDescription="Choose a store or create the first annual summary."
          >
            <>
              <DataTable
                columns={columns}
                rows={pageItems}
                keyField="yearlyReportId"
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

        <Card title="Selected report" subtitle="Narrative annual summary and reporting period">
          {selectedReport ? (
            <dl className="detail-list">
              <div>
                <dt>Store</dt>
                <dd>{selectedReport.storeName}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{selectedReport.reportYear}</dd>
              </div>
              <div>
                <dt>Annual summary</dt>
                <dd>{selectedReport.annualSummary || 'No summary provided'}</dd>
              </div>
            </dl>
          ) : (
            <p>Select a yearly report to review its annual summary.</p>
          )}
        </Card>
      </div>

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
