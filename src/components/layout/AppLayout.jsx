import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`app-shell ${isCollapsed ? 'app-shell--collapsed' : ''}`.trim()}>
      <Sidebar isCollapsed={isCollapsed} />
      <div className="app-shell__content">
        <Topbar onToggleSidebar={() => setIsCollapsed((current) => !current)} />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
