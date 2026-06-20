import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/appContext'
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
import { formatCurrency } from '../../utils/numberUtils'
import { ROUTES } from '../../constants/routeConstants'
import '../../page-styles/Dashboard/Dashboard.css'

// ── KPI card icon + color config ──────────────────────────────────────────

const KPI_CONFIG = {
  clients: {
    color: 'primary',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  stores: {
    color: 'secondary',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  daily: {
    color: 'success',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" />
      </svg>
    ),
  },
  monthly: {
    color: 'warning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  yearly: {
    color: 'info',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
}

// ── Quick access links ────────────────────────────────────────────────────

const QUICK_LINKS_ADMIN = [
  { label: 'Daily reports',   to: ROUTES.dailyReports,   desc: 'View & manage daily entries',  color: 'success' },
  { label: 'Monthly reports', to: ROUTES.monthlyReports, desc: 'Department monthly data',       color: 'warning' },
  { label: 'Yearly reports',  to: ROUTES.yearlyReports,  desc: 'Annual store summaries',        color: 'info' },
  { label: 'Clients',         to: ROUTES.clients,        desc: 'Manage client accounts',        color: 'primary' },
  { label: 'Stores',          to: ROUTES.stores,         desc: 'Store portfolio',               color: 'secondary' },
]

const QUICK_LINKS_CLIENT = [
  { label: 'Daily reports',   to: ROUTES.dailyReports,   desc: 'Your store daily records',     color: 'success' },
  { label: 'Monthly reports', to: ROUTES.monthlyReports, desc: 'Monthly department data',       color: 'warning' },
  { label: 'Yearly reports',  to: ROUTES.yearlyReports,  desc: 'Annual summaries',              color: 'info' },
]

// ── Component ─────────────────────────────────────────────────────────────

function DashboardPage() {
  const { notify, selectedStoreId, setSelectedStoreId } = useContext(AppContext)
  const { user } = useAuth()
  const { isAdmin } = usePermissions()

  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: null,
    metrics: [],
    stores: [],
    recentReports: [],
    storeActive: 0,
    storeInactive: 0,
  })

  const selectedStoreIdRef   = useRef(selectedStoreId)
  selectedStoreIdRef.current = selectedStoreId
  const hasAutoSelectedRef   = useRef(false)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

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

          if (!isMounted) return

          setDashboardState({
            loading: false,
            error: null,
            stores,
            recentReports: dailyReports.slice(0, 6),
            storeActive:   stores.filter((s) => s.status === 'ACTIVE').length,
            storeInactive: stores.filter((s) => s.status === 'INACTIVE').length,
            metrics: [
              { id: 'clients',  label: 'Clients',          value: clients.length,        caption: 'Registered accounts' },
              { id: 'stores',   label: 'Stores',            value: stores.length,         caption: 'In portfolio' },
              { id: 'daily',    label: 'Daily records',     value: dailyReports.length,   caption: 'All tracked entries' },
              { id: 'monthly',  label: 'Monthly records',   value: monthlyReports.length, caption: 'Dept-level entries' },
              { id: 'yearly',   label: 'Yearly records',    value: yearlyReports.length,  caption: 'Annual summaries' },
            ],
          })
          return
        }

        // ── Client flow ──────────────────────────────────────────────────
        const stores = await storeService.getClientStores()
        const currentStoreId  = selectedStoreIdRef.current
        const fallbackStoreId = currentStoreId || stores[0]?.storeId || ''

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

        if (!isMounted) return

        setDashboardState({
          loading: false,
          error: null,
          stores,
          recentReports: dailyReports.slice(0, 6),
          storeActive: 0,
          storeInactive: 0,
          metrics: [
            { id: 'stores',   label: 'Accessible stores',  value: stores.length,         caption: 'Owner & partner' },
            { id: 'daily',    label: 'Daily records',       value: dailyReports.length,   caption: 'For focused store' },
            { id: 'monthly',  label: 'Monthly records',     value: monthlyReports.length, caption: 'For focused store' },
            { id: 'yearly',   label: 'Yearly records',      value: yearlyReports.length,  caption: 'For focused store' },
          ],
        })
      } catch (error) {
        if (!isMounted) return
        const details = handleServiceError(error)
        setDashboardState((s) => ({ ...s, loading: false, error }))
        notify({ type: 'error', title: 'Dashboard load failed', message: details.message })
      }
    }

    loadDashboard()
    return () => { isMounted = false }
  }, [isAdmin, notify, setSelectedStoreId])

  const storeOptions = useMemo(
    () => dashboardState.stores.map((s) => ({ label: s.storeName, value: String(s.storeId) })),
    [dashboardState.stores],
  )

  const quickLinks = isAdmin ? QUICK_LINKS_ADMIN : QUICK_LINKS_CLIENT

  return (
    <div className="dashboard-page">

      {/* ── Welcome banner ── */}
      <div className="db-welcome">
        <div className="db-welcome__body">
          <div className="db-welcome__text">
            <span className="db-welcome__greeting">{greeting},</span>
            <h1 className="db-welcome__name">{user?.fullName || 'Welcome back'}</h1>
            <p className="db-welcome__meta">
              <span className="db-welcome__role">{isAdmin ? 'Administrator' : 'Client'}</span>
              <span className="db-welcome__sep" aria-hidden="true">·</span>
              {todayStr}
            </p>
          </div>

          {/* {!isAdmin && (
            <div className="db-welcome__selector">
              <SelectInput
                label="Focused store"
                name="selectedStoreId"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                options={storeOptions}
                placeholder="Choose a store"
              />
            </div>
          )} */}
        </div>
        <div className="db-welcome__orbs" aria-hidden="true" />
      </div>

      {/* ── Async content ── */}
      <AsyncState
        isLoading={dashboardState.loading}
        error={dashboardState.error}
        isEmpty={!dashboardState.metrics.length}
        emptyTitle="No metrics available"
        emptyDescription="The dashboard will populate as stores and reports are created."
      >
        <>
          {/* KPI grid */}
          <div className="db-kpi-grid">
            {dashboardState.metrics.map((m) => {
              const cfg = KPI_CONFIG[m.id]
              return (
                <div key={m.id} className={`db-kpi-card db-kpi-card--${cfg.color}`}>
                  <div className="db-kpi-card__icon-wrap">{cfg.icon}</div>
                  <div className="db-kpi-card__body">
                    <span className="db-kpi-card__label">{m.label}</span>
                    <span className="db-kpi-card__value">{m.value.toLocaleString()}</span>
                    <span className="db-kpi-card__caption">{m.caption}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Main content grid */}
          <div className="db-main-grid">

            {/* Recent daily reports */}
            <Card
              title="Recent daily reports"
              subtitle={isAdmin ? 'Latest records across all stores' : 'Latest records for focused store'}
            >
              {dashboardState.recentReports.length > 0 ? (
                <>
                  <div className="db-activity-list">
                    {dashboardState.recentReports.map((r) => (
                      <div key={r.dailyReportId} className="db-activity-item">
                        <div className="db-activity-dot" />
                        <div className="db-activity-content">
                          <div className="db-activity-row">
                            <span className="db-activity-store">{r.storeName}</span>
                            <span className="db-activity-amount">{formatCurrency(r.groceryTotal)}</span>
                          </div>
                          <span className="db-activity-date">{formatDate(r.reportDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="db-card-footer">
                    <Link to={ROUTES.dailyReports} className="db-view-all">
                      View all daily reports →
                    </Link>
                  </div>
                </>
              ) : (
                <p className="db-empty-hint">No daily reports on record yet.</p>
              )}
            </Card>

            {/* Side column */}
            <div className="db-side-col">

              {/* Admin: store health */}
              {isAdmin && dashboardState.stores.length > 0 && (
                <Card title="Store health" subtitle="Active vs inactive breakdown">
                  <div className="db-health">
                    <div className="db-health__bar">
                      <div
                        className="db-health__fill db-health__fill--active"
                        style={{
                          width: `${(dashboardState.storeActive / dashboardState.stores.length) * 100}%`,
                        }}
                      />
                      <div
                        className="db-health__fill db-health__fill--inactive"
                        style={{
                          width: `${(dashboardState.storeInactive / dashboardState.stores.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="db-health__legend">
                      <div className="db-health__entry">
                        <span className="db-health__dot db-health__dot--active" />
                        <span className="db-health__key">Active</span>
                        <strong className="db-health__count">{dashboardState.storeActive}</strong>
                      </div>
                      <div className="db-health__entry">
                        <span className="db-health__dot db-health__dot--inactive" />
                        <span className="db-health__key">Inactive</span>
                        <strong className="db-health__count">{dashboardState.storeInactive}</strong>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Client: my stores */}
              {!isAdmin && (
                <Card title="My stores" subtitle="Your assigned store access">
                  {dashboardState.stores.length > 0 ? (
                    <div className="db-store-list">
                      {dashboardState.stores.map((s) => (
                        <div key={s.storeId} className="db-store-item">
                          <span className="db-store-name">{s.storeName}</span>
                          <span
                            className={`db-role-badge db-role-badge--${(s.clientRole || 'member').toLowerCase()}`}
                          >
                            {s.clientRole || 'MEMBER'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="db-empty-hint">No store assignments found.</p>
                  )}
                </Card>
              )}

              {/* Quick access */}
              <Card title="Quick access" subtitle="Jump to any report section">
                <div className="db-quick-links">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`db-quick-link db-quick-link--${link.color}`}
                    >
                      <div className="db-quick-link__text">
                        <span className="db-quick-link__label">{link.label}</span>
                        <span className="db-quick-link__desc">{link.desc}</span>
                      </div>
                      <span className="db-quick-link__arrow" aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </Card>

            </div>
          </div>
        </>
      </AsyncState>
    </div>
  )
}

export default DashboardPage
