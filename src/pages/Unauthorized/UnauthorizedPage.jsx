import { Link } from 'react-router-dom'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/ui/Card'
import { ROUTES } from '../../constants/routeConstants'
import '../../page-styles/Unauthorized/Unauthorized.css'

function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <PageHeader
        eyebrow="Access denied"
        title="This route is outside your permission boundary."
        description="Your account is authenticated, but the backend contract does not authorize this action."
      />

      <Card title="What you can do next">
        <p>Return to a route available to your role or sign in with an account that has the required access.</p>
        <Link className="text-link" to={ROUTES.dashboard}>
          Go to dashboard
        </Link>
      </Card>
    </div>
  )
}

export default UnauthorizedPage
