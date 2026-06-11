import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routeConstants'
import { useAuth } from '../../hooks/useAuth'
import horLogo from '../../assets/hor-logo.png'
import { Icon } from '../Landing/LandingIcons'
import LandingFooter from '../Landing/LandingFooter'
import { CONTACT_MAILTO, DEMO_MAILTO } from '../Landing/landingConstants'
import '../../page-styles/Landing/Landing.css'

const VALUES = [
  {
    icon: 'stores',
    title: 'Retail first',
    body: 'Every product decision starts from the shop floor — registers, deposits, departments — not from a generic software template.',
  },
  {
    icon: 'eye',
    title: 'Plain, honest numbers',
    body: 'Dashboards exist to tell the truth fast. We never bury a bad number behind a pretty chart.',
  },
  {
    icon: 'shield',
    title: 'Security by default',
    body: 'Role-based access, encrypted sessions, and strict data isolation between clients are built in, not bolted on.',
  },
  {
    icon: 'handshake',
    title: 'Partnership over projects',
    body: 'We measure success in years of operation together, not in delivered milestones.',
  },
]

const COMMITMENTS = [
  {
    icon: 'shield',
    title: 'Data protection',
    body: 'Client data is isolated per organization and store. Access is governed by roles, and sessions are protected with secure HttpOnly cookie authentication.',
  },
  {
    icon: 'users',
    title: 'Responsible access',
    body: 'Owners, partners, and administrators each see exactly what their role permits — nothing more.',
  },
  {
    icon: 'clock',
    title: 'Responsive support',
    body: 'Email inquiries are answered within one business day, and production issues are treated as our first priority.',
  },
]

// Official details — replace the placeholder values with the registered
// company information before publishing.
const COMPANY_FACTS = [
  ['Brand name', 'Hands Off Retail (HOR)'],
  ['Legal entity', '— add registered legal name'],
  ['Registration no.', '— add company registration number'],
  ['Founded', '— add year'],
  ['Headquarters', '— add registered address'],
  ['Website', 'handsoffretail.com'],
  ['Contact email', 'handsoffretailsdev@gmail.com'],
  ['Business focus', 'Retail software, analytics & reporting'],
]

const STATS = [
  ['Stores reporting daily', '24+'],
  ['Departments tracked', '100+'],
  ['Reports automated', 'Daily · Monthly · Yearly'],
]

function AboutPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="landing-page">
      <a href="#lp-main" className="lp-skip-link">
        Skip to content
      </a>

      <header className="lp-header">
        <div className="lp-container lp-header__inner">
          <Link className="lp-logo" to={ROUTES.landing} aria-label="Hands Off Retail home">
            <img src={horLogo} alt="Hands Off Retail" />
          </Link>
          <nav className="lp-nav" aria-label="Page sections">
            <Link className="lp-nav__tab" to={ROUTES.landing}>
              Home
            </Link>
            <span className="lp-nav__tab is-active" aria-current="page">
              About Us
            </span>
          </nav>
          <div className="lp-header__actions">
            {isAuthenticated ? (
              <Link className="lp-btn lp-btn--ghost" to={ROUTES.dashboard}>
                Open dashboard
              </Link>
            ) : (
              <Link className="lp-btn lp-btn--ghost" to={ROUTES.login}>
                Sign in
              </Link>
            )}
            <a className="lp-btn lp-btn--primary" href={DEMO_MAILTO}>
              Book a Demo
            </a>
          </div>
        </div>
      </header>

      <main id="lp-main">
        {/* Intro */}
        <section className="lp-hero" aria-labelledby="about-title">
          <div className="lp-container">
            <div className="lp-hero__copy">
              <p className="lp-eyebrow">About us</p>
              <h1 id="about-title">
                Putting retail data back in the <em>owner&apos;s</em> hands.
              </h1>
              <p className="lp-hero__sub">
                Hands Off Retail is a retail technology company. We build the software,
                analytics, and reporting that let store owners, chains, and distributors run
                their operations on live numbers instead of late spreadsheets.
              </p>
              <ul className="lp-hero__proof">
                {STATS.map(([label, value]) => (
                  <li key={label}>
                    {value} {label.toLowerCase()}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Mission & story */}
        <section className="lp-section" aria-labelledby="about-mission-title">
          <div className="lp-container">
            <p className="lp-eyebrow">Mission &amp; story</p>
            <h2 id="about-mission-title">Why we exist</h2>
            <div className="lp-grid lp-grid--3">
              <article className="lp-card">
                <span className="lp-icon-chip">
                  <Icon name="compass" />
                </span>
                <h3>Our mission</h3>
                <p>
                  Give every retailer — from a single counter to an enterprise chain — the same
                  quality of operational intelligence that the largest players build in-house.
                </p>
              </article>
              <article className="lp-card">
                <span className="lp-icon-chip">
                  <Icon name="spark" />
                </span>
                <h3>Our vision</h3>
                <p>
                  A retail industry where decisions about pricing, staffing, and stock are made
                  the same day the data is created — not at month-end.
                </p>
              </article>
              <article className="lp-card">
                <span className="lp-icon-chip">
                  <Icon name="boxes" />
                </span>
                <h3>Our story</h3>
                <p>
                  HOR began inside real stores: watching owners reconcile deposits by hand and
                  stitch reports from disconnected systems. We built the platform we wished
                  they had — and kept building it with them.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="lp-section lp-section--tint" aria-labelledby="about-values-title">
          <div className="lp-container">
            <p className="lp-eyebrow">What we stand for</p>
            <h2 id="about-values-title">The principles behind every release</h2>
            <div className="lp-grid lp-grid--4">
              {VALUES.map((value) => (
                <article key={value.title} className="lp-card">
                  <span className="lp-icon-chip">
                    <Icon name={value.icon} />
                  </span>
                  <h3>{value.title}</h3>
                  <p>{value.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Official information */}
        <section className="lp-section" aria-labelledby="about-facts-title">
          <div className="lp-container">
            <p className="lp-eyebrow">Official information</p>
            <h2 id="about-facts-title">Company details</h2>
            <p className="lp-section__sub">
              Registered and contact information for Hands Off Retail.
            </p>
            <dl className="lp-facts">
              {COMPANY_FACTS.map(([label, value]) => (
                <div key={label} className="lp-facts__row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Commitments */}
        <section className="lp-section lp-section--dark" aria-labelledby="about-commitments-title">
          <div className="lp-container">
            <p className="lp-eyebrow lp-eyebrow--light">Our commitments</p>
            <h2 id="about-commitments-title">What clients can hold us to</h2>
            <div className="lp-grid lp-grid--3">
              {COMMITMENTS.map((item) => (
                <article key={item.title} className="lp-card lp-card--dark">
                  <span className="lp-icon-chip lp-icon-chip--glass">
                    <Icon name={item.icon} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta" aria-labelledby="about-cta-title">
          <div className="lp-container lp-cta__inner">
            <h2 id="about-cta-title">Want to know more about working with us?</h2>
            <p>
              We&apos;re happy to share references, security details, and a walkthrough of the
              platform tailored to your stores.
            </p>
            <div className="lp-hero__ctas">
              <a className="lp-btn lp-btn--inverse lp-btn--lg" href={DEMO_MAILTO}>
                Book Demo
              </a>
              <a className="lp-btn lp-btn--glass lp-btn--lg" href={CONTACT_MAILTO}>
                Contact Our Team
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}

export default AboutPage
