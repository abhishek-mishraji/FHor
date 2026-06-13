import { Link, NavLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { usePermissions } from '../../hooks/usePermissions'
import horLogo from '../../assets/hor-logo.png'
import horBadge from '../../assets/hor-badge.png'

const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-5 4 3 5-7" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="7" r="4" />
      <path d="M2 21v-2a6 6 0 0 1 11.9-1" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  ),
  stores: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9" />
    </svg>
  ),
  storeMembers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  dailyReports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  ),
  monthlyReports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M7 3v4M17 3v4" />
    </svg>
  ),
  yearlyReports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.87 3.58-7 8-7s8 3.13 8 7" />
    </svg>
  ),
}

const Sidebar = ({ isCollapsed, isMobileOpen, onNavigate }) => {
  const { can } = usePermissions()

  const items = [
    { label: 'Dashboard', to: ROUTES.dashboard, icon: 'dashboard', visible: true },
    { label: 'Analytics', to: ROUTES.analytics, icon: 'analytics', visible: true },
    { label: 'Clients', to: ROUTES.clients, icon: 'clients', visible: can('manageClients') },
    { label: 'Stores', to: ROUTES.stores, icon: 'stores', visible: true },
    { label: 'Store Members', to: ROUTES.storeMembers, icon: 'storeMembers', visible: can('manageStoreMembers') },
    { label: 'Daily Reports', to: ROUTES.dailyReports, icon: 'dailyReports', visible: true },
    { label: 'Monthly Reports', to: ROUTES.monthlyReports, icon: 'monthlyReports', visible: true },
    { label: 'Yearly Reports', to: ROUTES.yearlyReports, icon: 'yearlyReports', visible: true },
    { label: 'Profile', to: ROUTES.profile, icon: 'profile', visible: true },
  ]

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'app-sidebar--collapsed' : ''} ${
        isMobileOpen ? 'app-sidebar--mobile-open' : ''
      }`.trim()}
    >
      <div className="app-sidebar__brand">
        <Link
          to={ROUTES.landing}
          className="app-sidebar__logo"
          aria-label="Go to the Hands Off Retail home page"
          onClick={onNavigate}
        >
          <img
            src={isCollapsed ? horBadge : horLogo}
            alt="Hands Off Retail"
          />
        </Link>
        {!isCollapsed ? <p className="app-sidebar__eyebrow">Control Room</p> : null}
      </div>

      <nav className="app-sidebar__nav">
        {items
          .filter((item) => item.visible)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`.trim()
              }
            >
              <span className="app-sidebar__link-icon">
                {NAV_ICONS[item.icon]}
              </span>
              <span className="app-sidebar__link-label">{item.label}</span>
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}

export default Sidebar
