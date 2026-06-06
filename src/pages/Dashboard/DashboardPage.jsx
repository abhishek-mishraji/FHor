import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext } from '../../context/appContext'
import PageHeader from '../../components/common/PageHeader'
import StatsGrid from '../../components/common/StatsGrid'
import AsyncState from '../../components/common/AsyncState'
import Card from '../../components/ui/Card'
import SelectInput from '../../components/forms/SelectInput'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import clientService from '../../services/clientService'
import dailyReportService from '../../services/dailyReportService'
import monthlyReportService from '../../services/monthlyReportService'
import storeService from '../../services/storeService'
import yearlyReportService from '../../services/yearlyReportService'
import { handleServiceError } from '../../utils/errorHandler'
import { formatDate } from '../../utils/dateUtils'
import '../../page-styles/Dashboard/Dashboard.css'

function DashboardPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: null,
    metrics: [],
    stores: [],
    highlights: [],
  })
  const selectedStoreIdRef = useRef(selectedStoreId)
  selectedStoreIdRef.current = selectedStoreId
  const hasAutoSelectedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const loadDashboard = async () => {
      try {
        if (isAdmin) {
          const [clients, stores, dailyReports, monthlyReports, yearlyReports] = await Promise.all([
            clientService.getClients(),
            storeService.getStores(),
            dailyReportService.getAdminReports(),
            monthlyReportService.getAdminReports(),
            yearlyReportService.getAdminReports(),
          ])

          if (!isMounted) {
            return
          }

          setDashboardState({
            loading: false,
            error: null,
            stores,
            metrics: [
              { label: 'Clients', value: clients.length, caption: 'Registered client accounts' },
              { label: 'Stores', value: stores.length, caption: 'Across active and inactive operations' },
              { label: 'Daily reports', value: dailyReports.length, caption: 'All tracked daily records' },
              { label: 'Monthly reports', value: monthlyReports.length, caption: 'Department-level monthly entries' },
              { label: 'Yearly reports', value: yearlyReports.length, caption: 'Annual store summaries' },
            ],
            highlights: [
              `Active stores: ${stores.filter((store) => store.status === 'ACTIVE').length}`,
              `Inactive stores: ${stores.filter((store) => store.status === 'INACTIVE').length}`,
              `Latest daily report: ${dailyReports[0]?.reportDate ? formatDate(dailyReports[0].reportDate) : 'N/A'}`,
            ],
          })

          return
        }

        const stores = await storeService.getClientStores()
        const currentStoreId = selectedStoreIdRef.current
        let fallbackStoreId = currentStoreId || stores[0]?.storeId || ''

        if (!currentStoreId && stores[0]?.storeId && !hasAutoSelectedRef.current) {
          hasAutoSelectedRef.current = true
          setSelectedStoreId(String(fallbackStoreId))
        }

        const [dailyReports, monthlyReports, yearlyReports] = fallbackStoreId
          ? await Promise.all([
              dailyReportService.getClientReportsByStore(fallbackStoreId),
              monthlyReportService.getClientReportsByStore(fallbackStoreId),
              yearlyReportService.getClientReportsByStore(fallbackStoreId),
            ])
          : [[], [], []]

        if (!isMounted) {
          return
        }

        setDashboardState({
          loading: false,
          error: null,
          stores,
          metrics: [
            { label: 'Accessible stores', value: stores.length, caption: 'Owner and partner assignments' },
            { label: 'Selected store daily', value: dailyReports.length, caption: 'Daily entries for focused store' },
            { label: 'Selected store monthly', value: monthlyReports.length, caption: 'Monthly rows for focused store' },
            { label: 'Selected store yearly', value: yearlyReports.length, caption: 'Annual records for focused store' },
          ],
          highlights: [
            `Owner assignments: ${stores.filter((store) => store.clientRole === 'OWNER').length}`,
            `Partner assignments: ${stores.filter((store) => store.clientRole === 'PARTNER').length}`,
            `Focused store: ${stores.find((store) => String(store.storeId) === String(fallbackStoreId))?.storeName || 'None'}`,
          ],
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        const details = handleServiceError(error)
        setDashboardState({
          loading: false,
          error,
          metrics: [],
          stores: [],
          highlights: [],
        })
        notify({
          type: 'error',
          title: 'Dashboard load failed',
          message: details.message,
        })
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [isAdmin, notify])

  const storeOptions = useMemo(
    () =>
      dashboardState.stores.map((store) => ({
        label: store.storeName,
        value: String(store.storeId),
      })),
    [dashboardState.stores],
  )

  return (
    <div className="dashboard-page">
      <PageHeader
        eyebrow={isAdmin ? 'Administrator workspace' : 'Client workspace'}
        title={`Operational overview for ${user?.fullName || 'your session'}`}
        description="The dashboard reflects live backend entities, role permissions, and secure session state."
        actions={
          !isAdmin ? (
            <div className="dashboard-page__selector">
              <SelectInput
                label="Focused store"
                name="selectedStoreId"
                value={selectedStoreId}
                onChange={(event) => setSelectedStoreId(event.target.value)}
                options={storeOptions}
                placeholder="Choose a store"
              />
            </div>
          ) : null
        }
      />

      <AsyncState
        isLoading={dashboardState.loading}
        error={dashboardState.error}
        isEmpty={!dashboardState.metrics.length}
        emptyTitle="No metrics available"
        emptyDescription="The dashboard will populate as soon as stores and reports exist."
      >
        <>
          <StatsGrid items={dashboardState.metrics} />
          <Card title="Highlights" subtitle="What matters right now in the current workspace">
            <ul className="list-grid">
              {dashboardState.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </Card>
        </>
      </AsyncState>
    </div>
  )
}

export default DashboardPage
