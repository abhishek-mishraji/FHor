# Frontend Architecture Analysis

## 1. Backend Contract Summary

### Authentication

- The backend uses HttpOnly cookie authentication with `access_token` and `refresh_token`.
- The browser must send cookies automatically through `withCredentials: true`.
- The frontend must never persist JWTs in `localStorage` or `sessionStorage`.
- Session bootstrap cannot rely on a `/me` endpoint, so the frontend must validate an existing session by calling `POST /api/v1/auth/refresh`.
- Access-token expiry should be handled centrally in Axios by attempting one refresh flow and retrying the failed request once.

### Authorization

- `/api/v1/admin/**` is restricted to `ADMIN`.
- `/api/v1/client/**` is restricted to `CLIENT`.
- `CLIENT` users can only access store data if a `CLIENT_STORE_MAPPING` exists.
- `OWNER` versus `PARTNER` is informational for client UX and member management, but both roles can read reports.

### Response Model

- Every response uses a universal envelope:
  - `success`
  - `message`
  - `data`
  - `errors`
  - `timestamp`
- The frontend should unwrap this once in a shared API layer and expose parsed payloads to pages/components only.

## 2. Entity Relationship Analysis

### Core entities

- `AdminUser`
  - Auth-only identity for administrators.
- `ClientUser`
  - Managed by admins.
  - Has `status`, contact fields, and role `CLIENT`.
- `Store`
  - Has exactly one owner and zero or more partners.
  - Linked to reports.
- `ClientStoreMapping`
  - Junction entity between client users and stores.
  - Encodes `OWNER` or `PARTNER`.
- `DailyReport`
  - Belongs to one store and is date-based.
- `MonthlyReport`
  - Belongs to one store and is month/year + department based.
  - Supports Excel replacement upload.
- `YearlyReport`
  - Belongs to one store and is year-based.
- `RefreshToken`
  - Backend-only persistence concern; relevant to frontend only as part of session lifecycle.

### Frontend implications

- `Stores`, `StoreMembers`, and all report modules must share store lookups.
- `CLIENT` views are read-only and scoped to accessible stores only.
- `ADMIN` views require write-capable forms for clients, stores, store memberships, and reports.
- Report pages should share filtering, table, modal/form, and pagination-ready abstractions because the three report modules differ mostly in field sets.

## 3. Business Rule Mapping

- Each store must have exactly one `OWNER`.
  - Admin store creation must require `clientId`.
  - Store member deletion UI must block removing the current owner.
  - Ownership reassignment should be surfaced on store update instead of member removal.
- Store codes and client emails are unique.
  - Frontend validation should catch obvious issues, but conflict handling must remain server-driven.
- Monthly upload replaces all existing rows for the selected store/month/year.
  - Upload UX must explicitly communicate replacement behavior.
- Monthly upload filename must match `monthly_<month>_<year>.xlsx`.
  - Frontend can add pre-submit validation before the backend validates again.

## 4. Frontend Module Plan

### Shell and routing

- `AppRoutes`
  - Central route tree with lazy-loaded pages.
- `ProtectedRoute`
  - Blocks anonymous access.
- `PublicRoute`
  - Redirects authenticated users away from `/login`.
- `RoleBasedRoute`
  - Enforces `ADMIN` and `CLIENT` route segmentation.

### State model

- `AuthContext`
  - In-memory authenticated user.
  - Session bootstrap, login, logout, refresh-expiry handling.
- `AppContext`
  - Global UI concerns like toast notifications and cross-page store focus.
- Page-local state
  - Filters, modals, form drafts, and pagination remain local to keep global state small.

### Service model

- `services/api`
  - One Axios instance, one request interceptor, one response interceptor, one API client wrapper.
- `services/auth`
  - Auth requests, refresh orchestration, session event bus.
- Entity services
  - Thin domain-focused wrappers so pages never call Axios directly.
- `services/endpoints`
  - Central route definitions and path builders.

### Component model

- Layout components
  - Sidebar, header, shell.
- Reusable UI primitives
  - Buttons, cards, loaders, badges, empty states, modal.
- Reusable data components
  - Filter bars, tables, summary stats, async state handling.
- Reusable form components
  - Controlled inputs, selects, textareas, error rendering, file input.

## 5. Route Strategy

- Public
  - `/login`
  - `/unauthorized`
- Protected
  - `/app/dashboard`
  - `/app/profile`
  - `/app/stores`
  - `/app/reports/daily`
  - `/app/reports/monthly`
  - `/app/reports/yearly`
- Admin only
  - `/app/clients`
  - `/app/store-members`
- Fallback
  - `*` -> `NotFound`

## 6. API Strategy

- All requests use `withCredentials: true`.
- `401` handling:
  - Retry once through refresh flow unless the request itself is an auth endpoint.
- `403` handling:
  - Surface a friendly permission error and keep the user authenticated.
- All page-level data access goes through service functions that return already-unwrapped `data`.
- Request cancellation is supported through `AbortController` in hooks.
- Request deduplication is supported for repeated identical reads through keyed in-flight promises.

## 7. Page Strategy

- `Dashboard`
  - Role-aware operational overview.
- `Clients`
  - Admin list/create/update client accounts.
- `Stores`
  - Admin CRUD/status management and client read-only store access.
- `StoreMembers`
  - Admin membership management and ownership safeguards.
- `DailyReports`, `MonthlyReports`, `YearlyReports`
  - Shared reporting UX with role-aware write access.
  - Filters, search, list, selected-record inspection, create/update forms.
- `Profile`
  - Session identity and role summary.

## 8. Folder Structure

The implementation follows the requested feature-ready structure and extends it with entity-specific service files to keep API calls out of pages.
