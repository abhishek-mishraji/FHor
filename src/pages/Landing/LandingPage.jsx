import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routeConstants";
import { useAuth } from "../../hooks/useAuth";
import horLogo from "../../assets/hor-logo.png";
import { Icon } from "./LandingIcons";
import LandingFooter from "./LandingFooter";
import { CONTACT_MAILTO, DEMO_MAILTO } from "./landingConstants";
import "../../page-styles/Landing/Landing.css";

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "solutions", label: "What We Build" },
  { id: "platform", label: "Product Tour" },
  { id: "process", label: "How We Work" },
  { id: "contact", label: "Get in Touch" },
];

/* ------------------------------------------------------------------ */
/* Section content                                                     */
/* ------------------------------------------------------------------ */

const PROBLEMS = [
  {
    icon: "eye",
    title: "Multiple stores, zero visibility",
    body: "Each location reports its own way. By the time numbers reach you, the week is already over.",
  },
  {
    icon: "clipboard",
    title: "Manual reporting eats your week",
    body: "Spreadsheets stitched together by hand — slow to build, easy to break, impossible to trust.",
  },
  {
    icon: "boxes",
    title: "Inventory blind spots",
    body: "Voids, refunds, and shrinkage hide in the gaps between systems until they hit your margin.",
  },
  {
    icon: "clock",
    title: "Decisions arrive late",
    body: "When insight lags days behind the sale, every pricing and staffing call is a guess.",
  },
  {
    icon: "unplug",
    title: "Disconnected systems",
    body: "POS, back office, and finance each tell a different story. Reconciling them is a job in itself.",
  },
  {
    icon: "pulse",
    title: "No real-time pulse",
    body: "You find out about a bad day at month-end — long after you could have done something about it.",
  },
];

const FEATURES = [
  { icon: "pulse", label: "Real-Time Reporting" },
  { icon: "monitor", label: "KPI Dashboards" },
  { icon: "stores", label: "Store Comparison" },
  { icon: "chart", label: "Sales Analytics" },
  { icon: "report", label: "Custom Reports" },
  { icon: "users", label: "Role-Based Access" },
  { icon: "layers", label: "Data Visualization" },
  { icon: "spark", label: "Automated Insights" },
  { icon: "cloud", label: "Cloud Access" },
  { icon: "shield", label: "Secure Architecture" },
];

const DIFFERENTIATORS = [
  {
    icon: "stores",
    title: "Retail-Focused Expertise",
    body: "We only build for retail. Deposits, departments, shrinkage, and month-end close are our native language — not edge cases.",
  },
  {
    icon: "layers",
    title: "Scalable Solutions",
    body: "Start with one store or fifty. The same platform grows from a single counter to an enterprise chain.",
  },
  {
    icon: "code",
    title: "Custom Development",
    body: "Off-the-shelf tools force you into their workflow. We build around yours.",
  },
  {
    icon: "shield",
    title: "Enterprise Security",
    body: "Role-based access, encrypted sessions, and audited data isolation between clients and stores.",
  },
  {
    icon: "brain",
    title: "Data-Driven Decisions",
    body: "Every screen is designed to answer a business question — not just display numbers.",
  },
  {
    icon: "handshake",
    title: "Long-Term Partnership",
    body: "We stay after launch: support, iteration, and a roadmap that evolves with your business.",
  },
];

const PROCESS_STEPS = [
  {
    title: "Discover",
    body: "We map your stores, systems, and reporting pain points on the ground.",
  },
  {
    title: "Design",
    body: "Workflows and dashboards are prototyped against your real data.",
  },
  {
    title: "Develop",
    body: "Your platform is built in focused iterations you review every step.",
  },
  {
    title: "Deploy",
    body: "Rollout store by store, with training and zero-disruption migration.",
  },
  {
    title: "Support",
    body: "Ongoing monitoring, improvements, and a partner on call.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We went from compiling Friday reports by hand to seeing every store’s numbers the moment doors close. Month-end that took four days now takes one morning.",
    name: "Operations Director",
    org: "Regional grocery chain · 14 stores",
  },
  {
    quote:
      "For the first time, our owners and partners look at the same dashboard and see the same truth. Arguments about whose spreadsheet is right simply ended.",
    name: "Managing Partner",
    org: "Supermarket group · 6 locations",
  },
  {
    quote:
      "HOR didn’t sell us software and disappear. They learned how our distribution actually works and kept improving the platform every quarter.",
    name: "Chief Executive",
    org: "Retail distribution business",
  },
];

const TRUST_POINTS = [
  {
    icon: "stores",
    title: "Trusted by Retail Businesses",
    body: "Grocery chains, supermarkets, and distributors run their daily numbers on HOR.",
  },
  {
    icon: "compass",
    title: "Industry Expertise",
    body: "Built by people who understand registers, deposits, and department-level P&L.",
  },
  {
    icon: "layers",
    title: "Technology Expertise",
    body: "Modern cloud architecture, secure APIs, and analytics engineered for scale.",
  },
];

const LOGO_PLACEHOLDERS = [
  "Northline Grocers",
  "Meridian Markets",
  "CityFresh Stores",
  "Atlas Distribution",
  "Harvest & Co.",
  "PrimeMart Group",
];

const ABOUT_VALUES = [
  {
    icon: "stores",
    title: "Retail first",
    body: "Every product decision starts from the shop floor — registers, deposits, departments — not from a generic software template.",
  },
  {
    icon: "eye",
    title: "Plain, honest numbers",
    body: "Dashboards exist to tell the truth fast. We never bury a bad number behind a pretty chart.",
  },
  {
    icon: "shield",
    title: "Security by default",
    body: "Role-based access, encrypted sessions, and strict data isolation between clients are built in, not bolted on.",
  },
  {
    icon: "handshake",
    title: "Partnership over projects",
    body: "We measure success in years of operation together, not in delivered milestones.",
  },
];

const ABOUT_COMMITMENTS = [
  {
    icon: "shield",
    title: "Data protection",
    body: "Client data is isolated per organization and store. Access is governed by roles, and sessions are protected with secure HttpOnly cookie authentication.",
  },
  {
    icon: "users",
    title: "Responsible access",
    body: "Owners, partners, and administrators each see exactly what their role permits — nothing more.",
  },
  {
    icon: "clock",
    title: "Responsive support",
    body: "Email inquiries are answered within one business day, and production issues are treated as our first priority.",
  },
];

const ABOUT_COMPANY_FACTS = [
  ["Brand name", "Hands Off Retail (HOR)"],
  ["Legal entity", "— add registered legal name"],
  ["Registration no.", "— add company registration number"],
  ["Founded", "— add year"],
  ["Headquarters", "— add registered address"],
  ["Website", "handsoffretail.com"],
  ["Contact email", "handsoffretailsdev@gmail.com"],
  ["Business focus", "Retail software, analytics & reporting"],
];

const ABOUT_STATS = [
  ["Stores reporting daily", "24+"],
  ["Departments tracked", "100+"],
  ["Reports automated", "Daily · Monthly · Yearly"],
];

/* ------------------------------------------------------------------ */
/* Decorative dashboard mockups (pure CSS/SVG, no assets)              */
/* ------------------------------------------------------------------ */

const TrendSvg = ({ id }) => (
  <svg
    viewBox="0 0 320 110"
    preserveAspectRatio="none"
    aria-hidden="true"
    className="lp-trend"
  >
    <defs>
      <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path
      d="M0 85 C30 80, 45 60, 70 62 S110 78, 135 64 S175 30, 200 36 S240 52, 265 38 S300 16, 320 20 V110 H0 Z"
      fill={`url(#${id}-fill)`}
    />
    <path
      d="M0 85 C30 80, 45 60, 70 62 S110 78, 135 64 S175 30, 200 36 S240 52, 265 38 S300 16, 320 20"
      fill="none"
      stroke="#2dd4bf"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const BARS = [42, 68, 55, 80, 62, 92, 74];

const BarRow = () => (
  <div className="lp-bars" aria-hidden="true">
    {BARS.map((height, index) => (
      <span key={index} style={{ height: `${height}%` }} />
    ))}
  </div>
);

const HeroMockup = () => (
  <div
    className="lp-mock"
    role="img"
    aria-label="Preview of the Hands Of Retail analytics dashboard showing sales KPIs, a revenue trend, and store rankings"
  >
    <div className="lp-mock__topbar">
      <span className="lp-mock__dot" />
      <span className="lp-mock__dot" />
      <span className="lp-mock__dot" />
      <p>Hands Of Retail · Control Room</p>
    </div>
    <div className="lp-mock__body">
      <aside className="lp-mock__nav">
        {["Dashboard", "Stores", "Daily", "Monthly", "Analytics"].map(
          (item, index) => (
            <span key={item} className={index === 0 ? "is-active" : ""}>
              {item}
            </span>
          ),
        )}
      </aside>
      <div className="lp-mock__main">
        <div className="lp-mock__kpis">
          <div className="lp-mock__kpi">
            <small>Net sales · MTD</small>
            <strong>$248,300</strong>
            <em className="up">▲ 12.4%</em>
          </div>
          <div className="lp-mock__kpi">
            <small>Active stores</small>
            <strong>24</strong>
            <em>All reporting</em>
          </div>
          <div className="lp-mock__kpi">
            <small>Refund rate</small>
            <strong>1.2%</strong>
            <em className="up">▼ 0.3 pts</em>
          </div>
        </div>
        <div className="lp-mock__chart">
          <div className="lp-mock__chart-head">
            <small>Revenue trend · last 30 days</small>
          </div>
          <TrendSvg id="hero" />
        </div>
        <div className="lp-mock__ranking">
          {[
            ["Citgo", 92],
            ["Sunoco", 78],
            ["Stop & Shop", 61],
          ].map(([store, width]) => (
            <div key={store} className="lp-mock__rank-row">
              <small>{store}</small>
              <span className="lp-mock__rank-bar">
                <span style={{ width: `${width}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SHOWCASES = [
  {
    tag: "Sales Dashboard",
    title: "Every register, one revenue picture",
    body: "Daily deposits, grocery totals, voids, and refunds roll up live from every store into a single trend you can act on the same day.",
    visual: "trend",
  },
  {
    tag: "Store Ranking",
    title: "Know your best store — and your struggling one",
    body: "Rank locations by net sales, deposits, or refund rate over any period. Spot the outlier before the quarter does.",
    visual: "ranking",
  },
  {
    tag: "Executive Reporting",
    title: "Board-ready numbers without the all-nighter",
    body: "Year-over-year comparisons, department breakdowns, and exportable summaries — generated in seconds, not weekends.",
    visual: "kpis",
  },
];

const ShowcaseVisual = ({ kind, index }) => {
  if (kind === "ranking") {
    return (
      <div className="lp-showcase__panel" aria-hidden="true">
        {[
          ["Store 07", 94],
          ["Store 12", 81],
          ["Store 03", 73],
          ["Store 19", 58],
          ["Store 05", 41],
        ].map(([label, width]) => (
          <div key={label} className="lp-mock__rank-row">
            <small>{label}</small>
            <span className="lp-mock__rank-bar">
              <span style={{ width: `${width}%` }} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "kpis") {
    return (
      <div
        className="lp-showcase__panel lp-showcase__panel--kpis"
        aria-hidden="true"
      >
        {[
          ["Gross", "$1.84M", "▲ 9.2%"],
          ["Net sales", "$1.52M", "▲ 11.0%"],
          ["Discounts", "$96K", "▼ 2.1%"],
          ["Refunds", "$41K", "▼ 0.8%"],
        ].map(([label, value, delta]) => (
          <div key={label} className="lp-mock__kpi">
            <small>{label}</small>
            <strong>{value}</strong>
            <em className="up">{delta}</em>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="lp-showcase__panel" aria-hidden="true">
      <TrendSvg id={`showcase-${index}`} />
      <BarRow />
    </div>
  );
};

const AboutView = () => (
  <>
    <section className="lp-hero" aria-labelledby="about-title">
      <div className="lp-container">
        <div className="lp-hero__copy">
          <p className="lp-eyebrow">About us</p>
          <h1 id="about-title">
            Putting retail data back in the <em>owner&apos;s</em> hands.
          </h1>
          <p className="lp-hero__sub">
            Hands Off Retail is a retail technology company. We build the
            software, analytics, and reporting that let store owners, chains,
            and distributors run their operations on live numbers instead of
            late spreadsheets.
          </p>
          <ul className="lp-hero__proof">
            {ABOUT_STATS.map(([label, value]) => (
              <li key={label}>
                {value} {label.toLowerCase()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

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
              Give every retailer — from a single counter to an enterprise chain
              — the same quality of operational intelligence that the largest
              players build in-house.
            </p>
          </article>
          <article className="lp-card">
            <span className="lp-icon-chip">
              <Icon name="spark" />
            </span>
            <h3>Our vision</h3>
            <p>
              A retail industry where decisions about pricing, staffing, and
              stock are made the same day the data is created — not at
              month-end.
            </p>
          </article>
          <article className="lp-card">
            <span className="lp-icon-chip">
              <Icon name="boxes" />
            </span>
            <h3>Our story</h3>
            <p>
              HOR began inside real stores: watching owners reconcile deposits
              by hand and stitch reports from disconnected systems. We built the
              platform we wished they had — and kept building it with them.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section
      className="lp-section lp-section--tint"
      aria-labelledby="about-values-title"
    >
      <div className="lp-container">
        <p className="lp-eyebrow">What we stand for</p>
        <h2 id="about-values-title">The principles behind every release</h2>
        <div className="lp-grid lp-grid--4">
          {ABOUT_VALUES.map((value) => (
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

    <section className="lp-section" aria-labelledby="about-facts-title">
      <div className="lp-container">
        <p className="lp-eyebrow">Official information</p>
        <h2 id="about-facts-title">Company details</h2>
        <p className="lp-section__sub">
          Registered and contact information for Hands Off Retail.
        </p>
        <dl className="lp-facts">
          {ABOUT_COMPANY_FACTS.map(([label, value]) => (
            <div key={label} className="lp-facts__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>

    <section className="lp-section" aria-labelledby="about-commitments-title">
      <div className="lp-container">
        <p className="lp-eyebrow">Our commitments</p>
        <h2 id="about-commitments-title">What clients can hold us to</h2>
        <div className="lp-grid lp-grid--3">
          {ABOUT_COMMITMENTS.map((item) => (
            <article key={item.title} className="lp-card">
              <span className="lp-icon-chip">
                <Icon name={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* <section className="lp-cta" aria-labelledby="about-cta-title">
      <div className="lp-container lp-cta__inner">
        <h2 id="about-cta-title">Want to know more about working with us?</h2>
        <p>
          We&apos;re happy to share references, security details, and a
          walkthrough of the platform tailored to your stores.
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
    </section> */}
  </>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LandingPage({ initialView = "overview" }) {
  const { isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState(initialView);

  const switchView = (viewId) => {
    setActiveView(viewId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAboutClick = () => {
    setActiveView("about");
    window.history.replaceState(
      {},
      "",
      window.location.pathname + window.location.search,
    );
    window.requestAnimationFrame(() => {
      document
        .getElementById("about")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="landing-page">
      <a href="#lp-main" className="lp-skip-link">
        Skip to content
      </a>

      <header className="lp-header">
        <div className="lp-container lp-header__inner">
          <p className="lp-logo">
            <img src={horLogo} alt="Hands Off Retail" />
          </p>
          <nav className="lp-nav" aria-label="Page sections">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                className={`lp-nav__tab ${activeView === view.id ? "is-active" : ""}`}
                aria-current={activeView === view.id ? "page" : undefined}
                onClick={() => switchView(view.id)}
              >
                {view.label}
              </button>
            ))}
            <button
              type="button"
              className="lp-nav__tab"
              onClick={handleAboutClick}
            >
              About Us
            </button>
          </nav>
          <div className="lp-header__actions lp-header__actions--desktop">
            {isAuthenticated ? (
              <Link
                className="lp-btn lp-btn--ghost lp-header__secondary"
                to={ROUTES.dashboard}
              >
                Open dashboard
              </Link>
            ) : (
              <Link
                className="lp-btn lp-btn--ghost lp-header__secondary"
                to={ROUTES.login}
              >
                Sign in
              </Link>
            )}
            {/* <a
              className="lp-btn lp-btn--primary lp-header__cta"
              href={DEMO_MAILTO}
            >
              <span className="lp-header__cta-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="5" width="16" height="15" rx="3" />
                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
              </span>
              Book a Demo
            </a> */}
          </div>
        </div>
      </header>

      <main id="lp-main">
        {activeView === "overview" ? (
          <div className="lp-view">
            {/* 1 — Hero */}
            <section className="lp-hero" aria-labelledby="lp-hero-title">
              <div className="lp-container lp-hero__inner">
                <div className="lp-hero__copy">
                  <p className="lp-eyebrow">Retail technology partner</p>
                  <h1 id="lp-hero-title">
                    One platform to manage every <em>store</em>, <em>sale</em>,
                    and <em>insight</em>.
                  </h1>
                  <p className="lp-hero__sub">
                    Hands Of Retail digitizes your operations end to end — live
                    sales analytics, multi-store reporting, and custom retail
                    software that replaces spreadsheets with real-time
                    decisions.
                  </p>
                  <div className="lp-hero__ctas">
                    <a
                      className="lp-btn lp-btn--primary lp-btn--lg"
                      href={DEMO_MAILTO}
                    >
                      Book a Demo
                    </a>
                    <a
                      className="lp-btn lp-btn--outline lp-btn--lg"
                      href={CONTACT_MAILTO}
                    >
                      Schedule Consultation
                    </a>
                  </div>
                  <ul className="lp-hero__proof">
                    <li>Multi-store rollups in real time</li>
                    <li>Built for grocery, supermarket &amp; distribution</li>
                    <li>Custom-fit, not off-the-shelf</li>
                  </ul>
                </div>
                <HeroMockup />
              </div>
            </section>

            {/* 2 — Trust */}
            <section
              className="lp-trust"
              aria-label="Why retailers trust Hands Of Retail"
            >
              <div className="lp-container">
                <div className="lp-trust__points">
                  {TRUST_POINTS.map((point) => (
                    <div key={point.title} className="lp-trust__point">
                      <span className="lp-icon-chip">
                        <Icon name={point.icon} />
                      </span>
                      <div>
                        <h3>{point.title}</h3>
                        <p>{point.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="lp-trust__label">
                  Powering daily operations for retailers like
                </p>
                <ul
                  className="lp-logo-row"
                  aria-label="Client logo placeholders"
                >
                  {LOGO_PLACEHOLDERS.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 3 — Problems */}
            <section className="lp-section" aria-labelledby="lp-problems-title">
              <div className="lp-container">
                <p className="lp-eyebrow">The reality of running retail</p>
                <h2 id="lp-problems-title">
                  Your stores generate data all day. Can you see it?
                </h2>
                <p className="lp-section__sub">
                  Most multi-store retailers run on lagging spreadsheets and
                  disconnected systems. These are the problems we remove.
                </p>
                <div className="lp-grid lp-grid--3">
                  {PROBLEMS.map((problem) => (
                    <article
                      key={problem.title}
                      className="lp-card lp-card--problem"
                    >
                      <span className="lp-icon-chip lp-icon-chip--warn">
                        <Icon name={problem.icon} />
                      </span>
                      <h3>{problem.title}</h3>
                      <p>{problem.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "platform" ? (
          <div className="lp-view">
            {/* 5 — Platform features */}
            <section
              className="lp-section"
              id="platform"
              aria-labelledby="lp-platform-title"
            >
              <div className="lp-container lp-platform">
                <div className="lp-platform__copy">
                  <p className="lp-eyebrow">The HOR platform</p>
                  <h2 id="lp-platform-title">
                    Enterprise-grade analytics, without the enterprise bloat
                  </h2>
                  <p className="lp-section__sub">
                    A focused platform that does the retail essentials
                    exceptionally well — and is extended with custom modules
                    when your operation needs more.
                  </p>
                  <ul className="lp-feature-list">
                    {FEATURES.map((feature) => (
                      <li key={feature.label}>
                        <span className="lp-feature-list__icon">
                          <Icon name={feature.icon} size={16} />
                        </span>
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lp-platform__visual" aria-hidden="true">
                  <div className="lp-showcase__panel">
                    <div className="lp-mock__kpis">
                      <div className="lp-mock__kpi">
                        <small>Today</small>
                        <strong>$31,920</strong>
                        <em className="up">▲ 6.8%</em>
                      </div>
                      <div className="lp-mock__kpi">
                        <small>Deposits</small>
                        <strong>$28,400</strong>
                        <em>Reconciled</em>
                      </div>
                    </div>
                    <TrendSvg id="platform" />
                    <BarRow />
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "solutions" ? (
          <div className="lp-view">
            {/* 6 — Why HOR */}
            <section className="lp-section" aria-labelledby="lp-why-title">
              <div className="lp-container">
                <p className="lp-eyebrow">Why Hands Of Retail</p>
                <h2 id="lp-why-title">
                  A technology partner that speaks retail
                </h2>
                <div className="lp-grid lp-grid--3">
                  {DIFFERENTIATORS.map((item) => (
                    <article key={item.title} className="lp-card">
                      <span className="lp-icon-chip">
                        <Icon name={item.icon} />
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "platform" ? (
          <div className="lp-view">
            {/* 7 — Dashboard showcase */}
            <section className="lp-section" aria-labelledby="lp-showcase-title">
              <div className="lp-container">
                <p className="lp-eyebrow">Inside the product</p>
                <h2 id="lp-showcase-title">
                  Dashboards your whole organization will actually use
                </h2>
                <div className="lp-showcases">
                  {SHOWCASES.map((showcase, index) => (
                    <article key={showcase.tag} className="lp-showcase">
                      <div className="lp-showcase__copy">
                        <span className="lp-tag">{showcase.tag}</span>
                        <h3>{showcase.title}</h3>
                        <p>{showcase.body}</p>
                      </div>
                      <ShowcaseVisual kind={showcase.visual} index={index} />
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "process" ? (
          <div className="lp-view">
            {/* 8 — Process */}
            <section
              className="lp-section lp-section--tint"
              id="process"
              aria-labelledby="lp-process-title"
            >
              <div className="lp-container">
                <p className="lp-eyebrow">How we work</p>
                <h2 id="lp-process-title">
                  From first conversation to fully running platform
                </h2>
                <ol className="lp-process">
                  {PROCESS_STEPS.map((step, index) => (
                    <li key={step.title} className="lp-process__step">
                      <span className="lp-process__num" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* 9 — Testimonials */}
            <section
              className="lp-section"
              aria-labelledby="lp-testimonials-title"
            >
              <div className="lp-container">
                <p className="lp-eyebrow">What retailers say</p>
                <h2 id="lp-testimonials-title">
                  Results our clients measure in hours saved
                </h2>
                <div className="lp-grid lp-grid--3">
                  {TESTIMONIALS.map((testimonial) => (
                    <figure key={testimonial.org} className="lp-quote">
                      <blockquote>“{testimonial.quote}”</blockquote>
                      <figcaption>
                        <strong>{testimonial.name}</strong>
                        <span>{testimonial.org}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "contact" ? (
          <div className="lp-view">
            {/* Contact details */}
            <section className="lp-section" aria-labelledby="lp-contact-title">
              <div className="lp-container">
                <p className="lp-eyebrow">Get in touch</p>
                <h2 id="lp-contact-title">Let&apos;s talk about your stores</h2>
                <p className="lp-section__sub">
                  Tell us how your operation runs today — how many stores, what
                  systems, where the reporting hurts. We&apos;ll come back with
                  a concrete plan.
                </p>
                <div className="lp-grid lp-grid--3">
                  <article className="lp-card">
                    <span className="lp-icon-chip">
                      <Icon name="report" />
                    </span>
                    <h3>Email us</h3>
                    <p>
                      Share your questions or requirements — we reply within one
                      business day.
                    </p>
                    <a className="lp-card__more" href={CONTACT_MAILTO}>
                      handsoffretailsdev@gmail.com
                    </a>
                  </article>
                  <article className="lp-card">
                    <span className="lp-icon-chip">
                      <Icon name="monitor" />
                    </span>
                    <h3>Book a live demo</h3>
                    <p>
                      A 30-minute walkthrough of the platform using scenarios
                      from your business.
                    </p>
                    <a className="lp-card__more" href={DEMO_MAILTO}>
                      Request a time slot <span aria-hidden="true">→</span>
                    </a>
                  </article>
                  <article className="lp-card">
                    <span className="lp-icon-chip">
                      <Icon name="users" />
                    </span>
                    <h3>Already a client?</h3>
                    <p>
                      Head to your workspace to see today&apos;s numbers across
                      your stores.
                    </p>
                    <Link className="lp-card__more" to={ROUTES.login}>
                      Sign in to your dashboard{" "}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "about" ? (
          <div className="lp-view" id="about">
            <AboutView />
          </div>
        ) : null}

        {/* 10 — CTA */}
        <section className="lp-cta" id="contact" aria-labelledby="lp-cta-title">
          <div className="lp-container lp-cta__inner">
            <h2 id="lp-cta-title">
              Ready to modernize your retail operations?
            </h2>
            <p>
              Tell us how your stores run today. We&apos;ll show you what they
              could look like with real-time visibility — in a 30-minute
              walkthrough.
            </p>
            <div className="lp-hero__ctas">
              <a
                className="lp-btn lp-btn--inverse lp-btn--lg"
                href={DEMO_MAILTO}
              >
                Book Demo
              </a>
              <a
                className="lp-btn lp-btn--glass lp-btn--lg"
                href={CONTACT_MAILTO}
              >
                Contact Our Team
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingPage;
