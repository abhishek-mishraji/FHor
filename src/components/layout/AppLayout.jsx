import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const MOBILE_QUERY = '(max-width: 980px)'

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  // One toggle, two behaviors: on mobile it opens/closes the drawer,
  // on desktop it collapses/expands the rail.
  const handleToggleSidebar = () => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      setIsMobileNavOpen((current) => !current)
    } else {
      setIsCollapsed((current) => !current)
    }
  }

  const closeMobileNav = () => setIsMobileNavOpen(false)

  return (
    <div className={`app-shell ${isCollapsed ? 'app-shell--collapsed' : ''}`.trim()}>
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileNavOpen}
        onNavigate={closeMobileNav}
      />
      {isMobileNavOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeMobileNav}
        />
      ) : null}
      <div className="app-shell__content">
        <Topbar onToggleSidebar={handleToggleSidebar} isMobileNavOpen={isMobileNavOpen} />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
