import { useCallback, useContext, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import AsyncState from '../../components/common/AsyncState'
import PaginationBar from '../../components/common/PaginationBar'
import StatusBadge from '../../components/common/StatusBadge'
import SelectInput from '../../components/forms/SelectInput'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { STATUS_OPTIONS } from '../../constants/statusConstants'
import { useApi } from '../../hooks/useApi'
import { usePermissions } from '../../hooks/usePermissions'
import { useTable } from '../../hooks/useTable'
import clientService from '../../services/clientService'
import storeService from '../../services/storeService'
import { handleServiceError } from '../../utils/errorHandler'
import { validateStoreForm } from '../../validations/storeValidation'
import '../../page-styles/Stores/Stores.css'

const initialFormValues = {
  clientId: '',
  storeName: '',
  storeCode: '',
  address: '',
  contactNumber: '',
}

function StoresPage() {
  const { notify, setSelectedStoreId } = useContext(AppContext)
  const { isAdmin } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    clientId: '',
    status: '',
  })
  const [selectedStore, setSelectedStore] = useState(null)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const clientsQuery = useApi(() => clientService.getClients(), {
    auto: isAdmin,
    initialData: [],
  })

  const storesQuery = useApi(
    () =>
      isAdmin ? storeService.getStores(filters) : storeService.getClientStores(),
    {
      initialData: [],
      deps: [filters.clientId, filters.status, isAdmin],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({
          type: 'error',
          title: 'Stores load failed',
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
    data: storesQuery.data || [],
    searchTerm,
    searchFields: ['storeName', 'storeCode', 'clientName', 'address', 'contactNumber', 'status', 'clientRole'],
  })

  const clientOptions = useMemo(
    () =>
      (clientsQuery.data || []).map((client) => ({
        label: client.fullName,
        value: String(client.clientId),
      })),
    [clientsQuery.data],
  )

  const openCreateModal = () => {
    setSelectedStore(null)
    setFormValues(initialFormValues)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (store) => {
    setSelectedStore(store)
    setFormValues({
      clientId: String(store.clientId || ''),
      storeName: store.storeName || '',
      storeCode: store.storeCode || '',
      address: store.address || '',
      contactNumber: store.contactNumber || '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedStore(null)
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

  const { setData: setStoresData } = storesQuery

  const handleStatusToggle = useCallback(async (store) => {
    const nextStatus = store.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      const updatedStore = await storeService.updateStoreStatus(store.storeId, nextStatus)
      setStoresData((currentStores) =>
        (currentStores || []).map((item) => (item.storeId === updatedStore.storeId ? updatedStore : item)),
      )
      notify({
        type: 'success',
        title: 'Store updated',
        message: `${updatedStore.storeName} is now ${updatedStore.status}.`,
      })
    } catch (requestError) {
      const details = handleServiceError(requestError)
      notify({
        type: 'error',
        title: 'Status update failed',
        message: details.message,
      })
    }
  }, [notify, setStoresData])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateStoreForm(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      const payload = { ...formValues }

      const savedStore = selectedStore
        ? await storeService.updateStore(selectedStore.storeId, payload)
        : await storeService.createStore(payload)

      setStoresData((currentStores) => {
        if (!selectedStore) {
          return [savedStore, ...(currentStores || [])]
        }

        return (currentStores || []).map((store) => (store.storeId === savedStore.storeId ? savedStore : store))
      })

      notify({
        type: 'success',
        title: selectedStore ? 'Store updated' : 'Store created',
        message: `${savedStore.storeName} is ready for reporting workflows.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Store save failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo(() => {
    const sharedColumns = [
      { key: 'storeName', header: 'Store' },
      { key: 'storeCode', header: 'Code' },
      { key: 'clientName', header: isAdmin ? 'Owner' : 'Owner', render: (row) => row.clientName || 'N/A' },
      { key: 'address', header: 'Address', render: (row) => row.address || 'N/A' },
      { key: 'contactNumber', header: 'Contact', render: (row) => row.contactNumber || 'N/A' },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    ]

    if (!isAdmin) {
      sharedColumns.splice(3, 0, {
        key: 'clientRole',
        header: 'Membership',
        render: (row) => <StatusBadge value={row.clientRole} />,
      })
    }

    if (isAdmin) {
      sharedColumns.push({
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="inline-actions">
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => {
                event.stopPropagation()
                handleStatusToggle(row)
              }}
            >
              {row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        ),
      })
    }

    return sharedColumns
  }, [handleStatusToggle, isAdmin])

  return (
    <div className="stores-page">
      <PageHeader
        eyebrow={isAdmin ? 'Admin module' : 'Client module'}
        title="Store registry"
        description={
          isAdmin
            ? 'Manage store ownership, status, and operational metadata.'
            : 'Review the stores you can access through owner or partner mappings.'
        }
        actions={
          isAdmin ? (
            <Button type="button" onClick={openCreateModal}>
              New store
            </Button>
          ) : null
        }
      />

      <div className="page-grid page-grid--two">
        <Card title="Store list" subtitle="Search, filter, and inspect store relationships.">
          <div className="toolbar-grid toolbar-grid--wide">
            <TextInput
              label="Search"
              name="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search stores"
            />
            {isAdmin ? (
              <>
                <SelectInput
                  label="Owner"
                  name="clientId"
                  value={filters.clientId}
                  onChange={handleFilterChange}
                  options={clientOptions}
                  placeholder="All owners"
                />
                <SelectInput
                  label="Status"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  options={STATUS_OPTIONS}
                  placeholder="All statuses"
                />
              </>
            ) : null}
          </div>

          <AsyncState
            isLoading={storesQuery.loading}
            error={storesQuery.error}
            isEmpty={!storesQuery.data?.length}
            emptyTitle="No stores available"
            emptyDescription={
              isAdmin ? 'Create a store to establish ownership and reporting relationships.' : 'No stores are assigned to your account yet.'
            }
          >
            <>
              <DataTable
                columns={columns}
                rows={pageItems}
                keyField="storeId"
                onRowClick={(store) => {
                  setSelectedStore(store)
                  setSelectedStoreId(String(store.storeId))
                }}
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

        <Card title="Selected store" subtitle="Backend ownership and access metadata">
          {selectedStore ? (
            <dl className="detail-list">
              <div>
                <dt>Store name</dt>
                <dd>{selectedStore.storeName}</dd>
              </div>
              <div>
                <dt>Store code</dt>
                <dd>{selectedStore.storeCode}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{selectedStore.clientName}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge value={selectedStore.status} />
                </dd>
              </div>
              {!isAdmin ? (
                <div>
                  <dt>Your role</dt>
                  <dd>
                    <StatusBadge value={selectedStore.clientRole} />
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p>Select a store from the table to inspect its relationship details.</p>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        title={selectedStore ? 'Update store' : 'Create store'}
        onClose={closeModal}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <SelectInput
            label="Owner"
            name="clientId"
            value={formValues.clientId}
            onChange={handleFormChange}
            options={clientOptions}
            error={formErrors.clientId}
          />
          <TextInput
            label="Store name"
            name="storeName"
            value={formValues.storeName}
            onChange={handleFormChange}
            error={formErrors.storeName}
          />
          <TextInput
            label="Store code"
            name="storeCode"
            value={formValues.storeCode}
            onChange={handleFormChange}
            error={formErrors.storeCode}
          />
          <TextInput
            label="Address"
            name="address"
            value={formValues.address}
            onChange={handleFormChange}
            error={formErrors.address}
          />
          <TextInput
            label="Contact number"
            name="contactNumber"
            value={formValues.contactNumber}
            onChange={handleFormChange}
            error={formErrors.contactNumber}
          />
          <Button type="submit" isLoading={submitting}>
            {selectedStore ? 'Save changes' : 'Create store'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default StoresPage
