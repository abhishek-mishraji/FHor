import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import { ROUTES } from '../../constants/routeConstants'
import '../../page-styles/NotFound/NotFound.css'

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <PageHeader
        eyebrow="404"
        title="We couldn't find that workspace route."
        description="The page may have moved, or the URL does not exist in the current application shell."
      />

      <Card title="Return safely">
        <p>Use the sidebar or head back to the dashboard to continue working.</p>
        <Link className="text-link" to={ROUTES.dashboard}>
          Back to dashboard
        </Link>
      </Card>
    </div>
  )
}

export default NotFoundPage
