import { useCallback, useContext, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import AsyncState from '../../components/common/AsyncState'
import PaginationBar from '../../components/common/PaginationBar'
import StatusBadge from '../../components/common/StatusBadge'
import TextInput from '../../components/forms/TextInput'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { useTable } from '../../hooks/useTable'
import clientService from '../../services/clientService'
import { handleServiceError } from '../../utils/errorHandler'
import { validateClientForm } from '../../validations/clientValidation'
import '../../page-styles/Clients/Clients.css'

const initialFormValues = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
  address: '',
}

function ClientsPage() {
  const { notify } = useContext(AppContext)
  const [searchTerm, setSearchTerm] = useState('')
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [selectedClient, setSelectedClient] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data, error, loading, execute, setData } = useApi(() => clientService.getClients(), {
    initialData: [],
    onError: (requestError) => {
      const details = handleServiceError(requestError)
      notify({
        type: 'error',
        title: 'Clients load failed',
        message: details.message,
      })
    },
  })

  const {
    page,
    totalItems,
    totalPages,
    pageItems,
    pageSize,
    setPage,
    setPageSize,
  } = useTable({
    data: data || [],
    searchTerm,
    searchFields: ['fullName', 'email', 'phoneNumber', 'address', 'status'],
  })

  const openCreateModal = () => {
    setSelectedClient(null)
    setFormValues(initialFormValues)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const openEditModal = (client) => {
    setSelectedClient(client)
    setFormValues({
      fullName: client.fullName || '',
      email: client.email || '',
      password: '',
      phoneNumber: client.phoneNumber || '',
      address: client.address || '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedClient(null)
    setFormValues(initialFormValues)
    setFormErrors({})
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleStatusToggle = useCallback(async (client) => {
    const nextStatus = client.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      const updatedClient = await clientService.updateClientStatus(client.clientId, nextStatus)
      setData((currentClients) =>
        (currentClients || []).map((item) => (item.clientId === updatedClient.clientId ? updatedClient : item)),
      )
      notify({
        type: 'success',
        title: 'Client updated',
        message: `${updatedClient.fullName} is now ${updatedClient.status}.`,
      })
    } catch (requestError) {
      const details = handleServiceError(requestError)
      notify({
        type: 'error',
        title: 'Status update failed',
        message: details.message,
      })
    }
  }, [notify, setData])

  const columns = useMemo(
    () => [
      { key: 'fullName', header: 'Client' },
      { key: 'email', header: 'Email' },
      { key: 'phoneNumber', header: 'Phone', render: (row) => row.phoneNumber || 'N/A' },
      { key: 'address', header: 'Address', render: (row) => row.address || 'N/A' },
      { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
      {
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
      },
    ],
    [handleStatusToggle],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateClientForm(formValues, { isEdit: Boolean(selectedClient) })
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      const payload = selectedClient
        ? Object.fromEntries(
            Object.entries(formValues).filter(
              ([key, value]) =>
                value !== '' &&
                !(key === 'password' && !value) &&
                value !== selectedClient[key],
            ),
          )
        : formValues

      if (selectedClient && Object.keys(payload).length === 0) {
        notify({ type: 'info', title: 'No changes', message: 'No fields were modified.' })
        closeModal()
        return
      }

      const savedClient = selectedClient
        ? await clientService.updateClient(selectedClient.clientId, payload)
        : await clientService.createClient(formValues)

      setData((currentClients) => {
        if (!selectedClient) {
          return [savedClient, ...(currentClients || [])]
        }

        return (currentClients || []).map((client) =>
          client.clientId === savedClient.clientId ? savedClient : client,
        )
      })

      notify({
        type: 'success',
        title: selectedClient ? 'Client updated' : 'Client created',
        message: `${savedClient.fullName} is now ready for store assignment.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Client save failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="clients-page">
      <PageHeader
        eyebrow="Admin module"
        title="Client accounts"
        description="Create and maintain client identities that can own stores or participate as partners."
        actions={
          <Button type="button" onClick={openCreateModal}>
            New client
          </Button>
        }
      />

      <Card
        title="Directory"
        subtitle="Search across contact details and current account status."
        actions={
          <Button type="button" variant="ghost" onClick={() => execute()}>
            Refresh
          </Button>
        }
      >
        <div className="toolbar-grid">
          <TextInput
            label="Search"
            name="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search clients"
          />
        </div>

        <AsyncState
          isLoading={loading}
          error={error}
          isEmpty={!data?.length}
          emptyTitle="No clients yet"
          emptyDescription="Create the first client to start assigning store ownership."
        >
          <>
            <DataTable columns={columns} rows={pageItems} keyField="clientId" onRowClick={openEditModal} />
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

      <Modal
        isOpen={isModalOpen}
        title={selectedClient ? 'Update client' : 'Create client'}
        onClose={closeModal}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <TextInput
            label="Full name"
            name="fullName"
            value={formValues.fullName}
            onChange={handleChange}
            error={formErrors.fullName}
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleChange}
            error={formErrors.email}
          />
          <TextInput
            label={selectedClient ? 'New password (optional)' : 'Password'}
            name="password"
            type="password"
            value={formValues.password}
            onChange={handleChange}
            error={formErrors.password}
          />
          <TextInput
            label="Phone number"
            name="phoneNumber"
            value={formValues.phoneNumber}
            onChange={handleChange}
            error={formErrors.phoneNumber}
          />
          <TextInput
            label="Address"
            name="address"
            value={formValues.address}
            onChange={handleChange}
            error={formErrors.address}
          />
          <Button type="submit" isLoading={submitting}>
            {selectedClient ? 'Save changes' : 'Create client'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default ClientsPage
