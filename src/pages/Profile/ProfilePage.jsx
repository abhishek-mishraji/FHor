import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import Card from '../../components/ui/Card'
import { ROLE_LABELS } from '../../constants/roleConstants'
import { useAuth } from '../../hooks/useAuth'
import '../../page-styles/Profile/Profile.css'

function ProfilePage() {
  const { isSessionExpired, reason, user } = useAuth()

  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="Identity"
        title="Session profile"
        description="This page reflects the in-memory identity hydrated from the secure cookie-based auth flow."
      />

      <div className="page-grid page-grid--two">
        <Card title="User details">
          <dl className="detail-list">
            <div>
              <dt>Full name</dt>
              <dd>{user?.fullName || 'N/A'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email || 'N/A'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{ROLE_LABELS[user?.role] || user?.role || 'N/A'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Session posture">
          <dl className="detail-list">
            <div>
              <dt>State</dt>
              <dd>
                <StatusBadge value={isSessionExpired ? 'Expired' : 'Authenticated'} />
              </dd>
            </div>
            <div>
              <dt>Refresh model</dt>
              <dd>Cookie-based automatic refresh with retry-safe Axios interceptors</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{reason || 'Session is active and managed entirely in memory.'}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
