import { useContext } from 'react'
import { AppContext } from '../../context/appContext'
import { ROLE_LABELS } from '../../constants/roleConstants'
import { useAuth } from '../../hooks/useAuth'
import Button from '../ui/Button'

const Topbar = ({ onToggleSidebar, isMobileNavOpen = false }) => {
  const { notify } = useContext(AppContext)
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    notify({
      type: 'info',
      title: 'Signed out',
      message: 'Your secure session was closed successfully.',
    })
  }

  return (
    <header className="app-topbar">
      <div className="app-topbar__identity">
        <button
          type="button"
          className={`app-topbar__menu-btn ${isMobileNavOpen ? 'is-open' : ''}`.trim()}
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileNavOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className="app-topbar__welcome">Welcome back</p>
          <h3>{user?.fullName || 'Retail user'}</h3>
        </div>
      </div>

      <div className="app-topbar__actions">
        <div className="app-topbar__role">
          <span>{ROLE_LABELS[user?.role] || user?.role}</span>
          <small>{user?.email}</small>
        </div>
        <Button type="button" variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  )
}

export default Topbar
