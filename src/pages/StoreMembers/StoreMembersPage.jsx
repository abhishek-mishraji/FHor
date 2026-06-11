import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import AsyncState from '../../components/common/AsyncState'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import SelectInput from '../../components/forms/SelectInput'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { STORE_ROLES } from '../../constants/roleConstants'
import { useApi } from '../../hooks/useApi'
import clientService from '../../services/clientService'
import storeMemberService from '../../services/storeMemberService'
import storeService from '../../services/storeService'
import { handleServiceError } from '../../utils/errorHandler'
import { validateStoreMemberForm } from '../../validations/storeValidation'
import '../../page-styles/StoreMembers/StoreMembers.css'

const initialFormValues = {
  storeId: '',
  clientId: '',
  role: '',
}

function StoreMembersPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const [formValues, setFormValues] = useState(initialFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const storesQuery = useApi(() => storeService.getStores(), {
    initialData: [],
  })

  const clientsQuery = useApi(() => clientService.getClients(), {
    initialData: [],
  })

  const membersQuery = useApi(
    () => {
      if (!selectedStoreId) {
        return Promise.resolve([])
      }

      return storeMemberService.getStoreMembers(selectedStoreId)
    },
    {
      initialData: [],
      deps: [selectedStoreId],
      onError: (requestError) => {
        const details = handleServiceError(requestError)
        notify({
          type: 'error',
          title: 'Members load failed',
          message: details.message,
        })
      },
    },
  )

  useEffect(() => {
    if (!selectedStoreId && storesQuery.data?.length) {
      setSelectedStoreId(String(storesQuery.data[0].storeId))
    }
  }, [selectedStoreId, setSelectedStoreId, storesQuery.data])

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

  const openAddModal = () => {
    setFormValues({
      ...initialFormValues,
      storeId: selectedStoreId,
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setFormValues(initialFormValues)
    setFormErrors({})
    setIsModalOpen(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const { setData: setMembersData } = membersQuery

  const handleRemoveMember = useCallback(async (member) => {
    try {
      await storeMemberService.removeStoreMember(member.storeId, member.clientId)
      setMembersData((currentMembers) =>
        (currentMembers || []).filter((item) => item.clientId !== member.clientId),
      )
      notify({
        type: 'success',
        title: 'Member removed',
        message: `${member.clientName} was removed from the store.`,
      })
    } catch (requestError) {
      const details = handleServiceError(requestError)
      notify({
        type: 'error',
        title: 'Member removal failed',
        message: details.message,
      })
    }
  }, [notify, setMembersData])

  const columns = useMemo(
    () => [
      { key: 'clientName', header: 'Client' },
      { key: 'clientId', header: 'Client ID' },
      { key: 'role', header: 'Role', render: (row) => <StatusBadge value={row.role} /> },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={row.role === STORE_ROLES.OWNER}
            onClick={(event) => {
              event.stopPropagation()
              handleRemoveMember(row)
            }}
          >
            Remove
          </Button>
        ),
      },
    ],
    [handleRemoveMember],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateStoreMemberForm(formValues)
    setFormErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      const savedMember = await storeMemberService.addStoreMember({
        storeId: formValues.storeId,
        clientId: formValues.clientId,
        role: formValues.role,
      })

      setMembersData((currentMembers) => [...(currentMembers || []), savedMember])
      notify({
        type: 'success',
        title: 'Member added',
        message: `${savedMember.clientName} now has ${savedMember.role.toLowerCase()} access.`,
      })
      closeModal()
    } catch (requestError) {
      const details = handleServiceError(requestError)
      setFormErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Member save failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedStore = (storesQuery.data || []).find(
    (store) => String(store.storeId) === String(selectedStoreId),
  )

  return (
    <div className="store-members-page">
      <PageHeader
        eyebrow="Admin module"
        title="Store membership"
        description="Manage owner and partner assignments while preserving the backend ownership rules."
        actions={
          <Button type="button" onClick={openAddModal} disabled={!selectedStoreId}>
            Add member
          </Button>
        }
      />

      <div className="page-grid page-grid--two">
        <Card title="Membership list" subtitle="OWNER entries cannot be removed from this screen.">
          <div className="toolbar-grid">
            <SelectInput
              label="Store"
              name="selectedStoreId"
              value={selectedStoreId}
              onChange={(event) => setSelectedStoreId(event.target.value)}
              options={storeOptions}
              placeholder="Choose a store"
            />
          </div>

          <AsyncState
            isLoading={membersQuery.loading || storesQuery.loading}
            error={membersQuery.error || storesQuery.error}
            isEmpty={!membersQuery.data?.length}
            emptyTitle="No members found"
            emptyDescription="Choose a store and assign an owner or partner to populate this list."
          >
            <DataTable columns={columns} rows={membersQuery.data || []} keyField="clientId" />
          </AsyncState>
        </Card>

        <Card title="Rule summary" subtitle="Business rules derived from the backend schema">
          <ul className="list-grid">
            <li>{selectedStore ? `${selectedStore.storeName} is currently ${selectedStore.status.toLowerCase()}.` : 'Select a store to inspect its membership rules.'}</li>
            <li>Every store can have only one owner at a time.</li>
            <li>Owners cannot be removed here. Reassign ownership through the store update flow.</li>
            <li>Partners can be added or removed without affecting store identity.</li>
          </ul>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} title="Add store member" onClose={closeModal}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <SelectInput
            label="Store"
            name="storeId"
            value={formValues.storeId}
            onChange={handleChange}
            options={storeOptions}
            error={formErrors.storeId}
          />
          <SelectInput
            label="Client"
            name="clientId"
            value={formValues.clientId}
            onChange={handleChange}
            options={clientOptions}
            error={formErrors.clientId}
          />
          <SelectInput
            label="Role"
            name="role"
            value={formValues.role}
            onChange={handleChange}
            options={[
              { label: 'Owner', value: STORE_ROLES.OWNER },
              { label: 'Partner', value: STORE_ROLES.PARTNER },
            ]}
            error={formErrors.role}
          />
          <Button type="submit" isLoading={submitting}>
            Add member
          </Button>
        </form>
      </Modal>
    </div>
  )
}

export default StoreMembersPage
