import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/appContext";
import AsyncState from "../../components/common/AsyncState";
import StatusBadge from "../../components/common/StatusBadge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/forms/SelectInput";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import clientService from "../../services/clientService";
import dailyReportService from "../../services/dailyReportService";
import monthlyReportService from "../../services/monthlyReportService";
import storeService from "../../services/storeService";
import yearlyReportService from "../../services/yearlyReportService";
import { handleServiceError } from "../../utils/errorHandler";
import { formatDate, formatMonthYear } from "../../utils/dateUtils";
import { formatCurrency, formatNumber } from "../../utils/numberUtils";
import { ROUTES } from "../../constants/routeConstants";
import "../../page-styles/Dashboard/Dashboard.css";

// ── KPI card icon + color config ──────────────────────────────────────────

const KPI_CONFIG = {
  clients: {
    color: "primary",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  stores: {
    color: "secondary",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  daily: {
    color: "success",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 16 11 18 15 14" />
      </svg>
    ),
  },
  monthly: {
    color: "warning",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  yearly: {
    color: "info",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  analytics: {
    color: "primary",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M18.7 8 13 13.7l-3-3-4.7 4.7" />
      </svg>
    ),
  },
};

// Formats a KPI card's value according to its declared type — this is what
// gives every card a proper unit/currency treatment instead of a bare number.
const formatKpiValue = (metric) => {
  switch (metric.format) {
    case "currency":
      return formatCurrency(metric.value);
    case "number":
      return `${formatNumber(metric.value)}${metric.unit ? ` ${metric.unit}` : ""}`;
    case "date":
      return metric.value || "N/A";
    default:
      return Number(metric.value ?? 0).toLocaleString();
  }
};

const IconArrow = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="16"
    height="16"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const IconCalendar = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="15"
    height="15"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ── Quick access links (admin — unchanged) ─────────────────────────────────

const QUICK_LINKS_ADMIN = [
  {
    label: "Daily reports",
    to: ROUTES.dailyReports,
    desc: "View & manage daily entries",
    color: "success",
  },
  {
    label: "Monthly reports",
    to: ROUTES.monthlyReports,
    desc: "Department monthly data",
    color: "warning",
  },
  {
    label: "Yearly reports",
    to: ROUTES.yearlyReports,
    desc: "Annual store summaries",
    color: "info",
  },
  {
    label: "Clients",
    to: ROUTES.clients,
    desc: "Manage client accounts",
    color: "primary",
  },
  {
    label: "Stores",
    to: ROUTES.stores,
    desc: "Store portfolio",
    color: "secondary",
  },
];

// ── Client quick actions ────────────────────────────────────────────────

const CLIENT_QUICK_ACTIONS = [
  {
    id: "daily",
    label: "Daily reports",
    desc: "Your store daily records",
    to: ROUTES.dailyReports,
  },
  {
    id: "monthly",
    label: "Monthly reports",
    desc: "Monthly department data",
    to: ROUTES.monthlyReports,
  },
  {
    id: "yearly",
    label: "Yearly reports",
    desc: "Annual summaries",
    to: ROUTES.yearlyReports,
  },
  {
    id: "analytics",
    label: "Analytics",
    desc: "Charts & trends",
    to: ROUTES.analytics,
  },
];

// ── Presentational helpers (display only — no business/report calculations) ──

const relativeFromToday = (dateStr) => {
  if (!dateStr) return null;
  const diffDays = Math.round(
    (Date.now() - new Date(dateStr).getTime()) / 86400000,
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
};

const latestByDate = (rows, dateKey) =>
  rows.length
    ? [...rows].sort((a, b) =>
        String(b[dateKey] ?? "").localeCompare(String(a[dateKey] ?? "")),
      )[0]
    : null;

const latestMonthlyGroup = (monthlyReports) => {
  if (!monthlyReports.length) return null;
  const latest = [...monthlyReports].sort(
    (a, b) =>
      Number(b.reportYear) - Number(a.reportYear) ||
      Number(b.reportMonth) - Number(a.reportMonth),
  )[0];
  const sameMonth = monthlyReports.filter(
    (r) =>
      Number(r.reportYear) === Number(latest.reportYear) &&
      Number(r.reportMonth) === Number(latest.reportMonth),
  );
  return {
    report: latest,
    departmentCount: new Set(sameMonth.map((r) => r.departmentName || "N/A"))
      .size,
    grossTotal: sameMonth.reduce((sum, r) => sum + (Number(r.gross) || 0), 0),
    netSalesTotal: sameMonth.reduce(
      (sum, r) => sum + (Number(r.netSales) || 0),
      0,
    ),
  };
};

// ── Component ─────────────────────────────────────────────────────────────

function DashboardPage() {
  const { notify, selectedStoreId, setSelectedStoreId } =
    useContext(AppContext);
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();

  const [dashboardState, setDashboardState] = useState({
    loading: true,
    error: null,
    metrics: [],
    stores: [],
    recentReports: [],
    storeActive: 0,
    storeInactive: 0,
    latestDaily: null,
    latestMonthly: null,
  });

  // Per-store "latest activity" for the My Stores grid — loads independently
  // of the main dashboard fetch so the store cards can render immediately
  // and fill in their activity once each store's reports arrive.
  const [storeActivity, setStoreActivity] = useState({});
  const [storeActivityLoading, setStoreActivityLoading] = useState(false);

  const hasAutoSelectedRef = useRef(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ── Admin dashboard load (unchanged data/logic; runs once per session) ──
  useEffect(() => {
    if (!isAdmin) return undefined;
    let isMounted = true;

    const loadAdminDashboard = async () => {
      try {
        const [clients, stores, dailyReports, monthlyReports, yearlyReports] =
          await Promise.all([
            clientService.getClients(),
            storeService.getStores(),
            dailyReportService.getAdminReports(),
            monthlyReportService.getAdminReports(),
            yearlyReportService.getAdminReports(),
          ]);

        if (!isMounted) return;

        setDashboardState({
          loading: false,
          error: null,
          stores,
          recentReports: dailyReports.slice(0, 6),
          storeActive: stores.filter((s) => s.status === "ACTIVE").length,
          storeInactive: stores.filter((s) => s.status === "INACTIVE").length,
          latestDaily: null,
          latestMonthly: null,
          metrics: [
            {
              id: "clients",
              label: "Clients",
              value: clients.length,
              caption: "Registered accounts",
            },
            {
              id: "stores",
              label: "Stores",
              value: stores.length,
              caption: "In portfolio",
            },
            {
              id: "daily",
              label: "Daily records",
              value: dailyReports.length,
              caption: "All tracked entries",
            },
            {
              id: "monthly",
              label: "Monthly records",
              value: monthlyReports.length,
              caption: "Dept-level entries",
            },
            {
              id: "yearly",
              label: "Yearly records",
              value: yearlyReports.length,
              caption: "Annual summaries",
            },
          ],
        });
      } catch (error) {
        if (!isMounted) return;
        const details = handleServiceError(error);
        setDashboardState((s) => ({ ...s, loading: false, error }));
        notify({
          type: "error",
          title: "Dashboard load failed",
          message: details.message,
        });
      }
    };

    loadAdminDashboard();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, notify]);

  // ── Client dashboard load — re-runs whenever the Focused Store changes ──
  // Root cause of the "stale dashboard" bug: this used to read selectedStoreId
  // through a ref specifically so the effect WOULDN'T re-run on selection
  // changes, which also meant it never refetched when the user switched
  // stores. selectedStoreId is now a real dependency, so every KPI, hero
  // card, and recent-activity list recomputes as soon as it changes.
  useEffect(() => {
    if (isAdmin) return undefined;
    let isMounted = true;

    const loadClientDashboard = async () => {
      try {
        const stores = await storeService.getClientStores();
        const fallbackStoreId = selectedStoreId || stores[0]?.storeId || "";

        if (
          !selectedStoreId &&
          stores[0]?.storeId &&
          !hasAutoSelectedRef.current
        ) {
          hasAutoSelectedRef.current = true;
          setSelectedStoreId(String(fallbackStoreId));
          // The line above changes selectedStoreId, which re-triggers this
          // effect with the resolved store already in place — no need to
          // fetch reports twice for the same store on first load.
          return;
        }

        if (!isMounted) return;
        setDashboardState((s) => ({ ...s, loading: true, error: null }));

        const [dailyReports, monthlyReports] = fallbackStoreId
          ? await Promise.all([
              dailyReportService.getClientReportsByStore(fallbackStoreId),
              monthlyReportService.getClientReportsByStore(fallbackStoreId),
            ])
          : [[], []];

        if (!isMounted) return;

        const latestDaily = latestByDate(dailyReports, "reportDate");

        setDashboardState({
          loading: false,
          error: null,
          stores,
          recentReports: dailyReports.slice(0, 6),
          storeActive: 0,
          storeInactive: 0,
          latestDaily,
          latestMonthly: latestMonthlyGroup(monthlyReports),
          metrics: [],
        });
      } catch (error) {
        if (!isMounted) return;
        const details = handleServiceError(error);
        setDashboardState((s) => ({ ...s, loading: false, error }));
        notify({
          type: "error",
          title: "Dashboard load failed",
          message: details.message,
        });
      }
    };

    loadClientDashboard();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, notify, selectedStoreId, setSelectedStoreId]);

  // Client only — fetch each assigned store's most recent daily report so the
  // My Stores cards can show real per-store activity (reuses the same
  // per-store endpoint the Daily Reports page already calls; no new API).
  useEffect(() => {
    if (isAdmin || dashboardState.loading || !dashboardState.stores.length)
      return;
    let isMounted = true;
    setStoreActivityLoading(true);

    Promise.allSettled(
      dashboardState.stores.map((store) =>
        dailyReportService
          .getClientReportsByStore(store.storeId)
          .then((reports) => [
            store.storeId,
            latestByDate(reports, "reportDate"),
          ]),
      ),
    ).then((results) => {
      if (!isMounted) return;
      const next = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const [storeId, latest] = result.value;
          next[storeId] = latest;
        }
      });
      setStoreActivity(next);
      setStoreActivityLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isAdmin, dashboardState.loading, dashboardState.stores]);

  const storeOptions = useMemo(
    () =>
      dashboardState.stores.map((s) => ({
        label: s.storeName,
        value: String(s.storeId),
      })),
    [dashboardState.stores],
  );

  const goToStore = (storeId, to) => {
    setSelectedStoreId(String(storeId));
    navigate(to);
  };

  return (
    <div className="dashboard-page">
      {/* ── Welcome banner ── */}
      <div className="db-welcome">
        <div className="db-welcome__body">
          <div className="db-welcome__text">
            <span className="db-welcome__greeting">{greeting},</span>
            <h1 className="db-welcome__name">
              {user?.fullName || "Welcome back"}
            </h1>
            <p className="db-welcome__meta">
              <span className="db-welcome__role">
                {isAdmin ? "Administrator" : "Client"}
              </span>
              <span className="db-welcome__sep" aria-hidden="true">
                ·
              </span>
              {todayStr}
            </p>
          </div>

          {!isAdmin && storeOptions.length > 1 && (
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
          )}
        </div>
        <div className="db-welcome__orbs" aria-hidden="true" />
      </div>

      {/* ── Async content ── */}
      <AsyncState
        isLoading={dashboardState.loading}
        error={dashboardState.error}
        isEmpty={
          isAdmin
            ? !dashboardState.metrics.length
            : !dashboardState.stores.length
        }
        emptyTitle={isAdmin ? "No metrics available" : "No stores assigned yet"}
        emptyDescription={
          isAdmin
            ? "The dashboard will populate as stores and reports are created."
            : "Once a store is assigned to your account, your reports will show up here."
        }
      >
        {isAdmin ? (
          <>
            {/* KPI grid */}
            <div className="db-kpi-grid">
              {dashboardState.metrics.map((m) => {
                const cfg = KPI_CONFIG[m.id];
                return (
                  <div
                    key={m.id}
                    className={`db-kpi-card db-kpi-card--${cfg.color}`}
                  >
                    <div className="db-kpi-card__icon-wrap">{cfg.icon}</div>
                    <div className="db-kpi-card__body">
                      <span className="db-kpi-card__label">{m.label}</span>
                      <span className="db-kpi-card__value">
                        {formatKpiValue(m)}
                      </span>
                      <span className="db-kpi-card__caption">{m.caption}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main content grid */}
            <div className="db-main-grid">
              <Card
                title="Recent daily reports"
                subtitle="Latest records across all stores"
              >
                {dashboardState.recentReports.length > 0 ? (
                  <>
                    <div className="db-activity-list">
                      {dashboardState.recentReports.map((r) => (
                        <div key={r.dailyReportId} className="db-activity-item">
                          <div className="db-activity-dot" />
                          <div className="db-activity-content">
                            <div className="db-activity-row">
                              <span className="db-activity-store">
                                {r.storeName}
                              </span>
                              <span className="db-activity-amount">
                                {formatCurrency(r.groceryTotal)}
                              </span>
                            </div>
                            <span className="db-activity-date">
                              {formatDate(r.reportDate)}
                            </span>
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
                  <p className="db-empty-hint">
                    No daily reports on record yet.
                  </p>
                )}
              </Card>

              <div className="db-side-col">
                {dashboardState.stores.length > 0 && (
                  <Card
                    title="Store health"
                    subtitle="Active vs inactive breakdown"
                  >
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
                          <strong className="db-health__count">
                            {dashboardState.storeActive}
                          </strong>
                        </div>
                        <div className="db-health__entry">
                          <span className="db-health__dot db-health__dot--inactive" />
                          <span className="db-health__key">Inactive</span>
                          <strong className="db-health__count">
                            {dashboardState.storeInactive}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <Card
                  title="Quick access"
                  subtitle="Jump to any report section"
                >
                  <div className="db-quick-links">
                    {QUICK_LINKS_ADMIN.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`db-quick-link db-quick-link--${link.color}`}
                      >
                        <div className="db-quick-link__text">
                          <span className="db-quick-link__label">
                            {link.label}
                          </span>
                          <span className="db-quick-link__desc">
                            {link.desc}
                          </span>
                        </div>
                        <span
                          className="db-quick-link__arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── Hero cards: Last Daily Report + Latest Monthly Report ── */}
            <div className="db-hero-grid">
              {/* Last Daily Report */}
              <Card
                className="db-hero-card"
                title="Last daily report"
                subtitle="Most recent entry for the focused store"
              >
                {dashboardState.latestDaily ? (
                  <>
                    <div className="db-hero-head">
                      <div>
                        <span className="db-hero-store">
                          {dashboardState.latestDaily.storeName}
                        </span>
                        <span className="db-hero-date">
                          {formatDate(dashboardState.latestDaily.reportDate)}
                        </span>
                      </div>
                      <span className="db-hero-amount">
                        {formatCurrency(
                          dashboardState.latestDaily.groceryTotal,
                        )}
                      </span>
                    </div>
                    <div className="db-hero-kpis">
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">Cash deposit</span>
                        <span className="db-hero-kpi__value">
                          {formatCurrency(
                            dashboardState.latestDaily.cashDeposit,
                          )}
                        </span>
                      </div>
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">
                          Check deposit
                        </span>
                        <span className="db-hero-kpi__value">
                          {formatCurrency(
                            dashboardState.latestDaily.checkDeposit,
                          )}
                        </span>
                      </div>
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">
                          Volume (gallons)
                        </span>
                        <span className="db-hero-kpi__value">
                          {formatNumber(dashboardState.latestDaily.volume)}
                        </span>
                      </div>
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">Over / short</span>
                        <span className="db-hero-kpi__value">
                          {formatCurrency(dashboardState.latestDaily.overShort)}
                        </span>
                      </div>
                    </div>
                    <div className="db-card-footer">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate(ROUTES.dailyReports)}
                      >
                        View daily report <IconArrow />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="db-empty-hint">
                    No daily reports yet for this store.
                  </p>
                )}
              </Card>

              {/* Latest Monthly Report */}
              <Card
                className="db-hero-card"
                title="Latest monthly report"
                subtitle="Most recent month for the focused store"
              >
                {dashboardState.latestMonthly ? (
                  <>
                    <div className="db-hero-head">
                      <div>
                        <span className="db-hero-store">
                          {dashboardState.latestMonthly.report.storeName}
                        </span>
                        <span className="db-hero-date">
                          {formatMonthYear(
                            dashboardState.latestMonthly.report.reportMonth,
                            dashboardState.latestMonthly.report.reportYear,
                          )}
                        </span>
                      </div>
                      <span className="db-hero-amount">
                        {formatCurrency(
                          dashboardState.latestMonthly.grossTotal,
                        )}
                      </span>
                    </div>
                    <div className="db-hero-kpis">
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">Gross sales</span>
                        <span className="db-hero-kpi__value">
                          {formatCurrency(
                            dashboardState.latestMonthly.grossTotal,
                          )}
                        </span>
                      </div>
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">Net sales</span>
                        <span className="db-hero-kpi__value">
                          {formatCurrency(
                            dashboardState.latestMonthly.netSalesTotal,
                          )}
                        </span>
                      </div>
                      <div className="db-hero-kpi">
                        <span className="db-hero-kpi__label">Departments</span>
                        <span className="db-hero-kpi__value">
                          {dashboardState.latestMonthly.departmentCount}
                        </span>
                      </div>
                    </div>
                    <div className="db-card-footer">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate(ROUTES.monthlyReports)}
                      >
                        View monthly report <IconArrow />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="db-empty-hint">
                    No monthly reports yet for this store.
                  </p>
                )}
              </Card>
            </div>

            {/* ── My Stores ── */}
            <section className="db-section">
              <div className="db-section__header">
                <h2 className="db-section__title">My stores</h2>
                <span className="db-section__count">
                  {dashboardState.stores.length}
                </span>
              </div>

              {dashboardState.stores.length > 0 ? (
                <div className="db-store-grid">
                  {dashboardState.stores.map((store) => {
                    const activity = storeActivity[store.storeId];
                    return (
                      <div key={store.storeId} className="db-store-card">
                        <div className="db-store-card__header">
                          <span className="db-store-card__name">
                            {store.storeName}
                          </span>
                          {store.status && <StatusBadge value={store.status} />}
                        </div>
                        <span className="db-store-card__owner">
                          Owner: {store.clientName || "N/A"}
                        </span>

                        <div className="db-store-card__meta">
                          <div className="db-store-card__meta-item">
                            <IconCalendar />
                            <span>
                              {storeActivityLoading && !activity ? (
                                <span className="db-skeleton db-skeleton--text" />
                              ) : activity ? (
                                `Latest report: ${formatDate(activity.reportDate)}`
                              ) : (
                                "No reports yet"
                              )}
                            </span>
                          </div>
                          <div className="db-store-card__meta-item db-store-card__meta-item--muted">
                            {storeActivityLoading && !activity ? (
                              <span className="db-skeleton db-skeleton--text db-skeleton--short" />
                            ) : activity ? (
                              `Updated ${relativeFromToday(activity.reportDate)}`
                            ) : (
                              "No recent activity"
                            )}
                          </div>
                        </div>

                        <div className="db-store-card__actions">
                          <button
                            type="button"
                            onClick={() =>
                              goToStore(store.storeId, ROUTES.dailyReports)
                            }
                          >
                            Daily
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              goToStore(store.storeId, ROUTES.monthlyReports)
                            }
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              goToStore(store.storeId, ROUTES.yearlyReports)
                            }
                          >
                            Yearly
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              goToStore(store.storeId, ROUTES.analytics)
                            }
                          >
                            Analytics
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="db-empty-hint">No store assignments found.</p>
              )}
            </section>

            {/* ── Quick actions ── */}
            <section className="db-section">
              <div className="db-section__header">
                <h2 className="db-section__title">Quick actions</h2>
              </div>
              <div className="db-action-grid">
                {CLIENT_QUICK_ACTIONS.map((action) => {
                  const cfg = KPI_CONFIG[action.id];
                  return (
                    <Link
                      key={action.id}
                      to={action.to}
                      className={`db-action-card db-action-card--${cfg.color}`}
                    >
                      <div className="db-action-card__icon">{cfg.icon}</div>
                      <span className="db-action-card__label">
                        {action.label}
                      </span>
                      <span className="db-action-card__desc">
                        {action.desc}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* ── Recent activity (optional) ── */}
            {dashboardState.recentReports.length > 0 && (
              <Card
                title="Recent activity"
                subtitle="Latest daily records for the focused store"
              >
                <div className="db-activity-list">
                  {dashboardState.recentReports.map((r) => (
                    <div key={r.dailyReportId} className="db-activity-item">
                      <div className="db-activity-dot" />
                      <div className="db-activity-content">
                        <div className="db-activity-row">
                          <span className="db-activity-store">
                            {r.storeName}
                          </span>
                          <span className="db-activity-amount">
                            {formatCurrency(r.groceryTotal)}
                          </span>
                        </div>
                        <span className="db-activity-date">
                          {formatDate(r.reportDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="db-card-footer">
                  <Link to={ROUTES.dailyReports} className="db-view-all">
                    View all daily reports →
                  </Link>
                </div>
              </Card>
            )}
          </>
        )}
      </AsyncState>
    </div>
  );
}

export default DashboardPage;
