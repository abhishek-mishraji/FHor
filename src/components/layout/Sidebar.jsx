import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { usePermissions } from '../../hooks/usePermissions'

const Sidebar = ({ isCollapsed }) => {
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
    <aside className={`app-sidebar ${isCollapsed ? 'app-sidebar--collapsed' : ''}`}>
      <div className="app-sidebar__brand">
        <p className="app-sidebar__eyebrow">Hands of Retail</p>
        <h2>{isCollapsed ? 'HOR' : 'Control Room'}</h2>
      </div>

      <nav className="app-sidebar__nav">
        {items
          .filter((item) => item.visible)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
