import './styles/variables/tokens.css'
import './styles/themes/default.css'
import './styles/global/base.css'
import './page-styles/Shared/PageShared.css'
import AppRoutes from './routes/AppRoutes'
import ToastStack from './components/common/ToastStack'

function App() {
  return (
    <>
      <AppRoutes />
      <ToastStack />
    </>
  )
}

export default App
