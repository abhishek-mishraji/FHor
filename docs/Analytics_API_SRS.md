# Analytics API — Software Requirements Specification

**Version:** 1.0  
**Date:** 2026-06-11  
**Author:** Hands Of Retail Engineering  
**Base URL:** `http://localhost:8080`  
**Auth Scheme:** HttpOnly Cookies (`access_token`)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Decision](#2-architecture-decision)
3. [Common Design](#3-common-design)
   - [3.1 Endpoints](#31-endpoints)
   - [3.2 Request Parameters](#32-request-parameters)
   - [3.3 Response Envelope](#33-response-envelope)
   - [3.4 Valid Combinations Matrix](#34-valid-combinations-matrix)
   - [3.5 Valid Metrics per Report Type](#35-valid-metrics-per-report-type)
4. [Admin Analytics API](#4-admin-analytics-api)
5. [Client Analytics API](#5-client-analytics-api)
6. [All Use Cases with Examples](#6-all-use-cases-with-examples)
   - [6.1 Daily — Date Trend](#61-daily--date-trend-line-chart)
   - [6.2 Daily — Store Comparison](#62-daily--store-comparison-bar-chart)
   - [6.3 Monthly — Monthly Trend](#63-monthly--monthly-trend-line-chart)
   - [6.4 Monthly — Year-over-Year](#64-monthly--year-over-year-grouped-bar-chart)
   - [6.5 Monthly — Store Ranking](#65-monthly--store-ranking-bar-chart)
   - [6.6 Monthly — Department Breakdown](#66-monthly--department-breakdown-pie-chart)
   - [6.7 Monthly — Multi-metric Waterfall](#67-monthly--multi-metric-waterfall-stacked-bar)
   - [6.8 Daily — Average Across Stores](#68-daily--average-across-stores-multi-line)
7. [Validation Rules](#7-validation-rules)
8. [Error Reference](#8-error-reference)
9. [Performance Considerations](#9-performance-considerations)
10. [Security Considerations](#10-security-considerations)
11. [Appendix — Quick Reference](#appendix--quick-reference)

---

## 1. Overview

### 1.1 Purpose

The Analytics API provides a **single dynamic endpoint** for both admin and client roles to query aggregated report data suitable for frontend chart rendering. Rather than exposing multiple narrow endpoints per chart type, one flexible endpoint accepts parameters that control filtering, grouping, and aggregation — returning a **Chart.js / Recharts / ApexCharts-ready** response shape.

### 1.2 Scope

| Report Type | Supported | Notes |
|---|---|---|
| Daily Reports | ✅ | `daily_reports` table |
| Monthly Reports | ✅ | `monthly_reports` table |
| Yearly Reports | ❌ | No numeric fields — excluded from analytics |

### 1.3 Design Goals

| Goal | Decision |
|---|---|
| Single flexible endpoint | One endpoint handles all chart types via params |
| Frontend-agnostic response | `labels[]` + `datasets[]` maps to any chart library |
| Role-based data isolation | Admin sees all stores; client sees only their stores |
| No N+1 queries | Criteria API `JOIN` + `GROUP BY` in a single SQL |
| Validated combos | Invalid param combinations return `400` before hitting DB |

---

## 2. Architecture Decision

### Why Criteria API + JPA Specification — Not JPQL

```
┌─────────────────────────────────────────────────────────┐
│                    Request arrives                       │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │  Validation Layer   │  ← Blocks invalid combos early
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  JPA Specification  │  ← Builds WHERE predicates dynamically
              │  (Filter Layer)     │    storeIds IN, year IN, month =, from/to
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Criteria API       │  ← Applies GROUP BY + SUM/AVG/MAX/MIN
              │  TupleQuery         │    Single SQL, no N+1
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │  Response Mapper    │  ← Tuple[] → labels[] + datasets[]
              └─────────────────────┘
```

**JPA Specification** handles the `WHERE` clause (filterable, composable, reusable).  
**Criteria API TupleQuery** handles `SELECT aggregation + GROUP BY` (cannot be done with Specification alone).  
Together they form one clean SQL per request — no application-level aggregation.

### Admin vs Client — Same Service, Different StoreId Resolution

```
AdminAnalyticsController ──→ storeIds from REQUEST params
                          └──→ AnalyticsService.getAnalytics()  ← same method
ClientAnalyticsController ──→ storeIds from JWT (auto-resolved)
```

The client controller extracts `clientId` from JWT, fetches their store mappings, and injects `storeIds` into the request before passing to the service. The service is unaware of the caller's role.

---

## 3. Common Design

### 3.1 Endpoints

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/analytics/reports` | ADMIN | Query analytics across any store |
| `GET` | `/api/v1/client/analytics/reports` | CLIENT | Query analytics for own stores only |

### 3.2 Request Parameters

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `reportType` | `string` | ✅ | — | `DAILY` or `MONTHLY` |
| `groupBy` | `string` | ✅ | — | `DATE`, `MONTH`, `YEAR`, `STORE`, `DEPARTMENT` |
| `metric` | `List<string>` | ✅ | — | One or more metric names to aggregate |
| `aggregate` | `string` | ❌ | `SUM` | `SUM`, `AVG`, `MAX`, `MIN` |
| `storeIds` | `List<Long>` | ❌ | — | Admin only — filter by stores. Pass multiple as `storeIds=1&storeIds=2` |
| `clientId` | `Long` | ❌ | — | Admin only — auto-resolves to client's stores |
| `from` | `date` | ❌ | — | Daily only — start date `YYYY-MM-DD` |
| `to` | `date` | ❌ | — | Daily only — end date `YYYY-MM-DD` |
| `month` | `integer` | ❌ | — | Monthly only — specific month `1–12` |
| `year` | `List<integer>` | ❌ | — | Monthly only — one or many years. Pass as `year=2025&year=2026` |
| `departmentId` | `string` | ❌ | — | Monthly only — filter by department e.g. `A1` |

> **CLIENT endpoint:** `storeIds` and `clientId` params are **ignored**. Store access is resolved automatically from the JWT.

### 3.3 Response Envelope

Every response wraps the standard `ApiResponse<AnalyticsData>` envelope used across the entire API.

```json
{
  "success": true,
  "message": "Analytics fetched",
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      {
        "label": "Gross",
        "metric": "gross",
        "data": [50000.00, 62000.00, 58000.00]
      },
      {
        "label": "Net Sales",
        "metric": "netSales",
        "data": [41500.00, 53200.00, 48900.00]
      }
    ],
    "meta": {
      "reportType": "MONTHLY",
      "groupBy": "MONTH",
      "aggregate": "SUM",
      "storeIds": [1],
      "year": [2026],
      "totalDataPoints": 6
    }
  },
  "timestamp": "2026-06-11T10:00:00.000Z"
}
```

#### `data` Field Descriptions

| Field | Type | Description |
|---|---|---|
| `labels` | `string[]` | X-axis values. Dates for DATE, month numbers for MONTH, years for YEAR, store names for STORE, dept IDs for DEPARTMENT |
| `datasets` | `object[]` | One dataset per metric requested |
| `datasets[].label` | `string` | Human-readable metric name |
| `datasets[].metric` | `string` | Raw metric key matching the request param |
| `datasets[].data` | `number[]` | Aggregated values aligned with `labels[]` |
| `meta` | `object` | Echo of resolved query parameters for frontend awareness |
| `meta.totalDataPoints` | `integer` | Count of label buckets returned |

### 3.4 Valid Combinations Matrix

| `groupBy` | `DAILY` | `MONTHLY` | Notes |
|---|---|---|---|
| `DATE` | ✅ | ❌ | Daily has `reportDate`; monthly does not |
| `MONTH` | ❌ | ✅ | Monthly has `reportMonth`; daily does not |
| `YEAR` | ❌ | ✅ | Monthly has `reportYear`; daily does not |
| `STORE` | ✅ | ✅ | Both have `store_id` FK |
| `DEPARTMENT` | ❌ | ✅ | Only monthly has `department_id` |

### 3.5 Valid Metrics per Report Type

**DAILY metrics:**

| Metric Key | DB Column | Description |
|---|---|---|
| `groceryTotal` | `grocery_total` | Total grocery sales |
| `volume` | `volume` | Transaction volume |
| `cashDeposit` | `cash_deposit` | Cash deposit amount |
| `checkDeposit` | `check_deposit` | Check deposit amount |
| `overShort` | `over_short` | Over/short variance (can be negative) |
| `noSale` | `no_sale` | No-sale transaction count |
| `lineVoid` | `line_void` | Line void count |
| `voidAmount` | `void_amount` | Total voided amount |
| `refunds` | `refunds` | Total refund amount |

**MONTHLY metrics:**

| Metric Key | DB Column | Description |
|---|---|---|
| `gross` | `gross` | Gross sales before deductions |
| `netSales` | `net_sales` | Net sales after all deductions |
| `discount` | `discount` | Total discount amount |
| `promotion` | `promotion` | Total promotion deduction |
| `refund` | `refund` | Total refund amount |
| `voidAmount` | `void_amount` | Total voided transaction amount |

---

## 4. Admin Analytics API

```
GET /api/v1/admin/analytics/reports
```

**Auth Required:** ✅ ADMIN  
**HTTP Status (success):** `200 OK`

### Store Resolution Logic

| Params provided | Behavior |
|---|---|
| `storeIds=1&storeIds=2` | Queries only stores 1 and 2 |
| `clientId=5` | Resolves all stores mapped to client 5, queries those |
| Neither provided | Returns `400` — scope is required |
| Both provided | Returns `400` — ambiguous, not allowed |

### Request Example

```
GET /api/v1/admin/analytics/reports
    ?reportType=MONTHLY
    &groupBy=MONTH
    &metric=gross
    &metric=netSales
    &storeIds=1
    &year=2026
    &aggregate=SUM
```

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Analytics fetched",
  "data": {
    "labels": ["1", "2", "3", "4", "5", "6"],
    "datasets": [
      {
        "label": "Gross",
        "metric": "gross",
        "data": [50000.00, 62000.00, 58000.00, 71000.00, 66000.00, 80000.00]
      },
      {
        "label": "Net Sales",
        "metric": "netSales",
        "data": [41500.00, 53200.00, 48900.00, 60100.00, 55400.00, 68700.00]
      }
    ],
    "meta": {
      "reportType": "MONTHLY",
      "groupBy": "MONTH",
      "aggregate": "SUM",
      "storeIds": [1],
      "year": [2026],
      "totalDataPoints": 6
    }
  },
  "timestamp": "2026-06-11T10:00:00.000Z"
}
```

---

## 5. Client Analytics API

```
GET /api/v1/client/analytics/reports
```

**Auth Required:** ✅ CLIENT  
**HTTP Status (success):** `200 OK`

### Store Resolution Logic

- `storeIds` and `clientId` params are **silently ignored**
- `clientId` is extracted from JWT
- Store IDs resolved via `CLIENT_STORE_MAPPING` for that client
- If client has no store mappings → returns empty datasets, not an error

### Request Example

```
GET /api/v1/client/analytics/reports
    ?reportType=DAILY
    &groupBy=DATE
    &metric=groceryTotal
    &metric=voidAmount
    &from=2026-06-01
    &to=2026-06-30
    &aggregate=SUM
```

> No `storeIds` needed — resolved from JWT automatically.

### Success Response — `200 OK`

```json
{
  "success": true,
  "message": "Analytics fetched",
  "data": {
    "labels": ["2026-06-01", "2026-06-02", "2026-06-03"],
    "datasets": [
      {
        "label": "Grocery Total",
        "metric": "groceryTotal",
        "data": [12000.50, 13500.00, 11800.75]
      },
      {
        "label": "Void Amount",
        "metric": "voidAmount",
        "data": [150.75, 200.00, 120.50]
      }
    ],
    "meta": {
      "reportType": "DAILY",
      "groupBy": "DATE",
      "aggregate": "SUM",
      "storeIds": [1, 3],
      "from": "2026-06-01",
      "to": "2026-06-30",
      "totalDataPoints": 3
    }
  },
  "timestamp": "2026-06-11T10:00:00.000Z"
}
```

---

## 6. All Use Cases with Examples

---

### 6.1 Daily — Date Trend (Line Chart)

**Business Question:** "How did grocery sales trend day-by-day in June for Store A?"

**Chart Type:** Line / Area

```
GET /api/v1/admin/analytics/reports
    ?reportType=DAILY
    &groupBy=DATE
    &metric=groceryTotal
    &storeIds=1
    &from=2026-06-01
    &to=2026-06-30
    &aggregate=SUM
```

**Response:**
```json
{
  "labels": ["2026-06-01", "2026-06-02", "2026-06-03", "..."],
  "datasets": [
    {
      "label": "Grocery Total",
      "metric": "groceryTotal",
      "data": [12000.50, 13500.00, 11800.75, "..."]
    }
  ]
}
```

---

### 6.2 Daily — Store Comparison (Bar Chart)

**Business Question:** "Which store had the highest average cash deposit in June across 3 stores?"

**Chart Type:** Grouped Bar

```
GET /api/v1/admin/analytics/reports
    ?reportType=DAILY
    &groupBy=STORE
    &metric=cashDeposit
    &metric=groceryTotal
    &storeIds=1&storeIds=2&storeIds=3
    &from=2026-06-01
    &to=2026-06-30
    &aggregate=AVG
```

**Response:**
```json
{
  "labels": ["Walmart Downtown", "Target Uptown", "Costco East"],
  "datasets": [
    {
      "label": "Cash Deposit",
      "metric": "cashDeposit",
      "data": [5100.00, 4200.00, 6800.00]
    },
    {
      "label": "Grocery Total",
      "metric": "groceryTotal",
      "data": [11900.00, 9200.00, 14300.00]
    }
  ]
}
```

---

### 6.3 Monthly — Monthly Trend (Line Chart)

**Business Question:** "How did net sales trend month by month across 2026 for Store A?"

**Chart Type:** Line / Area

```
GET /api/v1/admin/analytics/reports
    ?reportType=MONTHLY
    &groupBy=MONTH
    &metric=gross
    &metric=netSales
    &storeIds=1
    &year=2026
    &aggregate=SUM
```

**Response:**
```json
{
  "labels": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
  "datasets": [
    {
      "label": "Gross",
      "metric": "gross",
      "data": [50000, 62000, 58000, 71000, 66000, 80000, 74000, 78000, 69000, 83000, 91000, 95000]
    },
    {
      "label": "Net Sales",
      "metric": "netSales",
      "data": [41500, 53200, 48900, 60100, 55400, 68700, 62000, 66500, 58200, 71300, 79500, 83000]
    }
  ]
}
```

> Frontend maps label `"1"` → `"Jan"`, `"2"` → `"Feb"` etc.

---

### 6.4 Monthly — Year-over-Year (Grouped Bar Chart)

**Business Question:** "How did net sales for Store A compare across 2024, 2025, and 2026?"

**Chart Type:** Grouped Bar

```
GET /api/v1/admin/analytics/reports
    ?reportType=MONTHLY
    &groupBy=YEAR
    &metric=gross
    &metric=netSales
    &storeIds=1
    &year=2024&year=2025&year=2026
    &aggregate=SUM
```

**Response:**
```json
{
  "labels": ["2024", "2025", "2026"],
  "datasets": [
    {
      "label": "Gross",
      "metric": "gross",
      "data": [480000.00, 560000.00, 620000.00]
    },
    {
      "label": "Net Sales",
      "metric": "netSales",
      "data": [390000.00, 460000.00, 510000.00]
    }
  ]
}
```

---

### 6.5 Monthly — Store Ranking (Bar Chart)

**Business Question:** "Which store performed best in June 2026 by net sales?"

**Chart Type:** Horizontal Bar / Leaderboard

```
GET /api/v1/admin/analytics/reports
    ?reportType=MONTHLY
    &groupBy=STORE
    &metric=netSales
    &clientId=5
    &month=6
    &year=2026
    &aggregate=SUM
```

**Response:**
```json
{
  "labels": ["Walmart Downtown", "Target Uptown", "Costco East"],
  "datasets": [
    {
      "label": "Net Sales",
      "metric": "netSales",
      "data": [68700.00, 54200.00, 71300.00]
    }
  ]
}
```

---

### 6.6 Monthly — Department Breakdown (Pie / Donut Chart)

**Business Question:** "What share of gross sales did each department contribute in June 2026 for Store A?"

**Chart Type:** Pie / Donut

```
GET /api/v1/admin/analytics/reports
    ?reportType=MONTHLY
    &groupBy=DEPARTMENT
    &metric=gross
    &storeIds=1
    &month=6
    &year=2026
    &aggregate=SUM
```

**Response:**
```json
{
  "labels": ["A1", "B2", "D12", "G5"],
  "datasets": [
    {
      "label": "Gross",
      "metric": "gross",
      "data": [32000.00, 18000.00, 27000.00, 15000.00]
    }
  ]
}
```

---

### 6.7 Monthly — Multi-metric Waterfall (Stacked Bar)

**Business Question:** "Show the full revenue breakdown month by month — where is money being lost?"

**Chart Type:** Stacked Bar / Waterfall

```
GET /api/v1/admin/analytics/reports
    ?reportType=MONTHLY
    &groupBy=MONTH
    &metric=gross
    &metric=discount
    &metric=promotion
    &metric=refund
    &metric=voidAmount
    &metric=netSales
    &storeIds=1
    &year=2026
    &aggregate=SUM
```

**Response:**
```json
{
  "labels": ["1", "2", "3", "4", "5", "6"],
  "datasets": [
    { "label": "Gross",      "metric": "gross",      "data": [50000, 62000, 58000, 71000, 66000, 80000] },
    { "label": "Discount",   "metric": "discount",   "data": [3000,  4000,  3500,  4500,  4000,  5000]  },
    { "label": "Promotion",  "metric": "promotion",  "data": [2000,  2500,  2200,  2800,  2500,  3000]  },
    { "label": "Refund",     "metric": "refund",     "data": [1500,  1800,  1600,  2000,  1800,  2200]  },
    { "label": "Void Amount","metric": "voidAmount", "data": [500,   700,   600,   900,   800,   1000]  },
    { "label": "Net Sales",  "metric": "netSales",   "data": [41500, 53200, 48900, 60100, 55400, 68700] }
  ]
}
```

---

### 6.8 Daily — Average Across Stores (Multi-Line)

**Business Question:** "What is the average daily void amount across all my stores over the last month?"

**Chart Type:** Multi-line (one line per metric)

```
GET /api/v1/client/analytics/reports
    ?reportType=DAILY
    &groupBy=DATE
    &metric=voidAmount
    &metric=refunds
    &from=2026-06-01
    &to=2026-06-30
    &aggregate=AVG
```

**Response:**
```json
{
  "labels": ["2026-06-01", "2026-06-02", "2026-06-03"],
  "datasets": [
    {
      "label": "Void Amount",
      "metric": "voidAmount",
      "data": [145.25, 188.50, 112.00]
    },
    {
      "label": "Refunds",
      "metric": "refunds",
      "data": [78.00, 92.50, 65.75]
    }
  ]
}
```

---

## 7. Validation Rules

All validation runs **before** any database access. Returns `400` immediately on failure.

### 7.1 Cross-field Validation

| Rule | Error Message |
|---|---|
| `groupBy=DATE` with `reportType=MONTHLY` | `"groupBy DATE is only valid for DAILY reports"` |
| `groupBy=MONTH` with `reportType=DAILY` | `"groupBy MONTH is only valid for MONTHLY reports"` |
| `groupBy=YEAR` with `reportType=DAILY` | `"groupBy YEAR is only valid for MONTHLY reports"` |
| `groupBy=DEPARTMENT` with `reportType=DAILY` | `"groupBy DEPARTMENT is only valid for MONTHLY reports"` |
| Metric not valid for report type | `"Metric 'gross' is not valid for DAILY reports"` |
| Neither `storeIds` nor `clientId` (admin only) | `"Either storeIds or clientId must be provided"` |
| Both `storeIds` and `clientId` (admin only) | `"Provide either storeIds or clientId, not both"` |

### 7.2 GroupBy-specific Required Params

| groupBy | Required additional params |
|---|---|
| `DATE` | At least one of `from` or `to` recommended; both optional but results may be large |
| `MONTH` | `year` (single value) required |
| `YEAR` | `year` (one or more values) required |
| `STORE` | No additional required |
| `DEPARTMENT` | `storeIds` + `year` required |

### 7.3 Param Constraints

| Param | Constraint | Error |
|---|---|---|
| `month` | 1–12 | `"month must be between 1 and 12"` |
| `year` | 4-digit positive integer | `"year must be a valid 4-digit year"` |
| `metric` | Must not be empty | `"At least one metric is required"` |
| `from` after `to` | Date range invalid | `"from date must be before to date"` |
| `aggregate` | Must be `SUM`, `AVG`, `MAX`, `MIN` | `"Invalid aggregate function"` |

---

## 8. Error Reference

All errors use the standard `ApiResponse` envelope with `"success": false`.

| HTTP Status | Scenario | Message |
|---|---|---|
| `400` | Invalid `reportType` value | `"Invalid reportType. Allowed: DAILY, MONTHLY"` |
| `400` | Invalid `groupBy` value | `"Invalid groupBy. Allowed: DATE, MONTH, YEAR, STORE, DEPARTMENT"` |
| `400` | Invalid `aggregate` value | `"Invalid aggregate. Allowed: SUM, AVG, MAX, MIN"` |
| `400` | `groupBy` incompatible with `reportType` | `"groupBy X is not valid for Y reports"` |
| `400` | Metric invalid for report type | `"Metric 'X' is not valid for Y reports"` |
| `400` | Missing required param for groupBy | `"year is required when groupBy=MONTH"` |
| `400` | Neither `storeIds` nor `clientId` (admin) | `"Either storeIds or clientId must be provided"` |
| `400` | Both `storeIds` and `clientId` (admin) | `"Provide either storeIds or clientId, not both"` |
| `400` | `from` after `to` | `"from date must be before to date"` |
| `400` | `month` out of range | `"month must be between 1 and 12"` |
| `401` | Missing or invalid JWT | `"Authentication required"` |
| `403` | Wrong role | `"Access denied"` |
| `404` | `clientId` not found (admin resolving client stores) | `"Client not found"` |

---

## 9. Performance Considerations

### Database Indexes Recommended

```sql
-- Daily reports
CREATE INDEX idx_daily_store_date ON daily_reports(store_id, report_date);

-- Monthly reports
CREATE INDEX idx_monthly_store_month_year ON monthly_reports(store_id, report_month, report_year);
CREATE INDEX idx_monthly_dept ON monthly_reports(department_id);
```

**Why:**
- `groupBy=DATE` always filters `store_id` + `report_date` range — composite index eliminates full table scan
- `groupBy=DEPARTMENT` filters `department_id` — separate index for dept queries
- Without indexes, `GROUP BY + SUM` on a large table will do a sequential scan

### Query Design

- All aggregation happens **in the database** (single SQL) — no in-memory grouping in Java
- `JOIN` with `stores` table done via `LEFT JOIN` in Criteria API — avoids separate store lookup
- Empty result set returns `{ "labels": [], "datasets": [] }` — not an error

### Scalability Note

For high-traffic analytics, consider:
- **Query result caching** (Redis, 5–15 min TTL) keyed by request params hash
- **Materialized views** for YoY queries on large datasets
- **Pagination** not needed — analytics queries are inherently aggregated

---

## 10. Security Considerations

| Concern | Mitigation |
|---|---|
| Client accessing other stores | Client endpoint ignores `storeIds` param; resolves from JWT only |
| SQL injection via metric param | Metric names validated against a whitelist before use in Criteria API — never concatenated as raw SQL |
| Admin using `clientId` to access data | `clientId` must exist in DB; resolved to storeIds — no direct data bypass |
| Large date ranges causing DoS | Recommend max 365-day `from/to` range; can be enforced in validation |

---

## Appendix — Quick Reference

### All Valid Request Combinations

| # | reportType | groupBy | aggregate | Key Filters | Chart |
|---|---|---|---|---|---|
| 1 | `DAILY` | `DATE` | `SUM/AVG` | `storeIds`, `from`, `to` | Line / Area |
| 2 | `DAILY` | `STORE` | `SUM/AVG` | `storeIds`/`clientId`, `from`, `to` | Bar |
| 3 | `MONTHLY` | `MONTH` | `SUM/AVG` | `storeIds`, `year` (single) | Line |
| 4 | `MONTHLY` | `YEAR` | `SUM/AVG` | `storeIds`, `year` (multi) | Grouped Bar |
| 5 | `MONTHLY` | `STORE` | `SUM/AVG` | `clientId`, `month`, `year` | Bar / Leaderboard |
| 6 | `MONTHLY` | `DEPARTMENT` | `SUM/AVG` | `storeIds`, `month`, `year` | Pie / Donut |
| 7 | `MONTHLY` | `MONTH` | `SUM` | `storeIds`, `year`, all metrics | Stacked Bar / Waterfall |
| 8 | `DAILY` | `DATE` | `AVG` | `clientId`, `from`, `to` | Multi-line |

### Metrics Quick Reference

| Metric | DAILY | MONTHLY |
|---|---|---|
| `groceryTotal` | ✅ | ❌ |
| `volume` | ✅ | ❌ |
| `cashDeposit` | ✅ | ❌ |
| `checkDeposit` | ✅ | ❌ |
| `overShort` | ✅ | ❌ |
| `noSale` | ✅ | ❌ |
| `lineVoid` | ✅ | ❌ |
| `refunds` | ✅ | ❌ |
| `gross` | ❌ | ✅ |
| `netSales` | ❌ | ✅ |
| `discount` | ❌ | ✅ |
| `promotion` | ❌ | ✅ |
| `refund` | ❌ | ✅ |
| `voidAmount` | ✅ | ✅ |

---

*End of Analytics API SRS — Hands Of Retail v1.0*
