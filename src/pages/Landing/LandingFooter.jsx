import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import horLogo from '../../assets/hor-logo.png'
import { Icon } from './LandingIcons'
import { CONTACT_MAILTO, DEMO_MAILTO } from './landingConstants'

const FOOTER_COLUMNS = [
  {
    title: 'Services',
    links: [
      { label: 'Custom Retail Software' },
      { label: 'Analytics & BI' },
      { label: 'Reporting Automation' },
      { label: 'System Integration' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Multi-Store Management' },
      { label: 'Store Performance' },
      { label: 'Sales Analytics' },
      { label: 'Executive Dashboards' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: ROUTES.about },
      { label: 'Our Process', to: ROUTES.landing },
      { label: 'Testimonials', to: ROUTES.landing },
      { label: 'Careers' },
    ],
  },
]

const LandingFooter = () => (
  <footer className="lp-footer">
    <div className="lp-container lp-footer__inner">
      <div className="lp-footer__brand">
        <p className="lp-logo lp-logo--chip">
          <img src={horLogo} alt="Hands Off Retail" />
        </p>
        <p>
          Custom retail software, analytics, and reporting for stores, chains, and
          distributors that run on data.
        </p>
        <a href="https://handsoffretail.com" target="_blank" rel="noreferrer">
          handsoffretail.com
        </a>
      </div>
      {FOOTER_COLUMNS.map((column) => (
        <nav key={column.title} aria-label={column.title}>
          <h4>{column.title}</h4>
          <ul>
            {column.links.map((link) => (
              <li key={link.label}>
                {link.to ? (
                  <Link to={link.to}>{link.label}</Link>
                ) : (
                  <a href={CONTACT_MAILTO}>{link.label}</a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      ))}
      <nav aria-label="Contact">
        <h4>Contact</h4>
        <ul>
          <li>
            <a href={CONTACT_MAILTO}>handsoffretailsdev@gmail.com</a>
          </li>
          <li>
            <a href={DEMO_MAILTO}>Book a demo</a>
          </li>
          <li>
            <Link to={ROUTES.login}>Client sign in</Link>
          </li>
        </ul>
        <div className="lp-footer__social" aria-label="Social links">
          <a href="https://handsoffretail.com" target="_blank" rel="noreferrer" aria-label="Website">
            <Icon name="cloud" size={16} />
          </a>
          <a href={CONTACT_MAILTO} aria-label="Email">
            <Icon name="report" size={16} />
          </a>
          <a href={DEMO_MAILTO} aria-label="Book a demo">
            <Icon name="handshake" size={16} />
          </a>
        </div>
      </nav>
    </div>
    <div className="lp-container lp-footer__legal">
      <p>© {new Date().getFullYear()} Hands Off Retail. All rights reserved.</p>
    </div>
  </footer>
)

export default LandingFooter
