# Hands Off Retail — Dashboard

The web frontend for **Hands Off Retail (HOR)**: a retail operations platform that gives
store owners, multi-store chains, and distributors live visibility into their daily and
monthly numbers. Built with React and Vite, it serves both the public marketing site and
the authenticated admin/client workspace against the HOR Spring Boot API.

🌐 [handsoffretail.com](https://handsoffretail.com)

## Features

### Public site
- **Landing page** (`/`) — tabbed marketing views (Overview, What We Build, Product Tour,
  How We Work, Get in Touch) with demo/consultation CTAs
- **About Us** (`/about`) — mission, values, official company information, and commitments

### Workspace (authenticated)
- **Role-based access** — `ADMIN` manages everything; `CLIENT` users see only the stores
  mapped to them (`OWNER` / `PARTNER` memberships)
- **Dashboard** — role-aware operational overview
- **Clients** (admin) — create and manage client accounts and statuses
- **Stores** — admin CRUD with status management; client read-only access
- **Store Members** (admin) — owner/partner membership with ownership safeguards
- **Daily Reports** — per-store deposits, grocery totals, voids, refunds, over/short
- **Monthly Reports** — department-level gross/net sales with filters (clients can filter
  by month locally) and bulk Excel upload (`monthly_<month>_<year>.xlsx`, replace-on-upload)
- **Yearly Reports** — annual summaries per store

### Platform behavior
- HttpOnly cookie authentication (`access_token` / `refresh_token`) with automatic
  refresh-and-retry on 401 — no tokens in `localStorage`
- Universal API envelope (`success / message / data / errors / timestamp`) unwrapped once
  in the shared API layer
- Request deduplication and `AbortController` cancellation in the data hooks
- Responsive shell: collapsible sidebar on desktop, hamburger + off-canvas drawer on mobile
- Toast notifications, loading/empty/error states, and accessible forms throughout

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite |
| Routing | react-router-dom 7 (lazy-loaded pages, role-based route guards) |
| HTTP | axios 1.x with request/response interceptors |
| State | React context (`AuthContext`, `AppContext`) + page-local state |
| Styling | Plain CSS with design tokens (no UI framework) |
| Linting | ESLint 10 |

## Getting started

### Prerequisites
- Node.js 20+
- The HOR backend API running (defaults to `http://localhost:8080`)

### Setup

```bash
npm install
npm run dev
```

The app starts on the Vite dev server (typically `http://localhost:5173`).

### Environment variables

Create a `.env` file in the project root (all optional — defaults shown):

```bash
VITE_API_BASE_URL=http://localhost:8080   # backend base URL
VITE_API_TIMEOUT=20000                    # request timeout (ms)
VITE_DEFAULT_PAGE_SIZE=10                 # table page size
VITE_DEBOUNCE_MS=300                      # input debounce
VITE_TOAST_DURATION=5000                  # toast auto-dismiss (ms)
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── assets/          # Logo and static images
├── components/
│   ├── common/      # PageHeader, DataTable, AsyncState, StatsGrid, ...
│   ├── forms/       # TextInput, SelectInput, FileInput
│   ├── layout/      # AppLayout, Sidebar, Topbar
│   └── ui/          # Button, Card, Modal, Loader, EmptyState, ...
├── config/          # environment.js (env var access)
├── constants/       # routes, roles, API constants
├── context/         # AuthContext, AppContext
├── hooks/           # useApi, useAuth, usePermissions, useTable, ...
├── pages/           # One folder per page (Landing, About, Login, Dashboard,
│                    #   Clients, Stores, StoreMembers, Daily/Monthly/YearlyReports, ...)
├── page-styles/     # Per-page CSS, scoped by page class
├── routes/          # AppRoutes, ProtectedRoute, PublicRoute, RoleBasedRoute
├── services/        # API layer: axios instance, interceptors, entity services
│   └── endpoints/   # Central endpoint path definitions
├── styles/          # Global tokens, themes, base styles
├── utils/           # Formatters, error handling, response parsing
└── validations/     # Client-side form validators
```

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | Public | Landing |
| `/about` | Public | About Us |
| `/login` | Public | Sign in |
| `/app/dashboard` | Authenticated | Dashboard |
| `/app/stores` | Authenticated | Stores |
| `/app/reports/daily` | Authenticated | Daily reports |
| `/app/reports/monthly` | Authenticated | Monthly reports |
| `/app/reports/yearly` | Authenticated | Yearly reports |
| `/app/profile` | Authenticated | Profile |
| `/app/clients` | Admin only | Clients |
| `/app/store-members` | Admin only | Store members |

## Documentation

- [`docs/API_SRS.md`](docs/API_SRS.md) — backend API specification
- [`docs/Frontend_Architecture.md`](docs/Frontend_Architecture.md) — frontend architecture analysis
- [`docs/Table_Schema.mmd`](docs/Table_Schema.mmd) — database entity relationships
- [`docs/Analytics_API_SRS.md`](docs/Analytics_API_SRS.md) — analytics API spec (feature not currently enabled in the frontend)

## Contact

- Email: [handsoffretailsdev@gmail.com](mailto:handsoffretailsdev@gmail.com)
- Website: [handsoffretail.com](https://handsoffretail.com)

© Hands Off Retail. All rights reserved.
