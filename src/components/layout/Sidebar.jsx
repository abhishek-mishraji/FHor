import { Link, NavLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { usePermissions } from '../../hooks/usePermissions'
import horLogo from '../../assets/hor-logo.png'
import horBadge from '../../assets/hor-badge.png'

const Sidebar = ({ isCollapsed, isMobileOpen, onNavigate }) => {
  const { can } = usePermissions()

  const items = [
    { label: 'Dashboard', to: ROUTES.dashboard, visible: true },
    { label: 'Clients', to: ROUTES.clients, visible: can('manageClients') },
    { label: 'Stores', to: ROUTES.stores, visible: true },
    { label: 'Store Members', to: ROUTES.storeMembers, visible: can('manageStoreMembers') },
    { label: 'Daily Reports', to: ROUTES.dailyReports, visible: true },
    { label: 'Monthly Reports', to: ROUTES.monthlyReports, visible: true },
    { label: 'Yearly Reports', to: ROUTES.yearlyReports, visible: true },
    { label: 'Profile', to: ROUTES.profile, visible: true },
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
              className={({ isActive }) =>
                `app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}`.trim()
              }
            >
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}

export default Sidebar
