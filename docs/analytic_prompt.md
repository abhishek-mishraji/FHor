# Enterprise Analytics Dashboard Integration Prompt

## Role

You are a Principal Frontend Architect, Senior React Engineer, UX Designer, Data Visualization Expert, and Analytics Platform Engineer.

I am providing:

1. Existing React Codebase
2. Analytics API SRS
3. Backend API SRS
4. Database Schema

Your task is to integrate a complete enterprise-grade Analytics Platform into the existing application.

### Important Rules

- DO NOT create a new project.
- DO NOT replace existing architecture.
- DO NOT ignore existing reusable components.
- Follow existing project conventions.
- Reuse existing components whenever possible.
- Prefer extension over replacement.

---

# Phase 1: Architecture Analysis (Mandatory)

Before writing any code:

Analyze the entire codebase and provide:

## Architecture Analysis

Explain:

- Project structure
- Existing pages
- Existing reusable components
- Existing table components
- Existing chart components
- Existing form components
- Existing API services
- Existing Axios setup
- Existing authentication flow
- Existing React Query usage
- Existing Context Providers
- Existing styling architecture

---

# Reuse Requirements

If existing project already contains:

- Table
- Card
- Modal
- Select
- Multi Select
- Date Picker
- Pagination
- Search Components
- Loader
- Export Components
- Chart Components

Reuse them.

Never create duplicates.

---

# Analytics Platform Goal

Build an analytics experience comparable to:

- Tableau
- Power BI
- Metabase
- Looker Studio

using the provided Analytics APIs.

The frontend must support every valid combination supported by the backend.

No hardcoded reports.

No hardcoded dashboards.

No hardcoded chart definitions.

Everything must be dynamic and configuration driven.

---

# Route

Create analytics module under:

/analytics

---

# Analytics Builder

Create a dynamic report builder.

Users can build any report supported by backend.

---

## Report Type

Dropdown:

- DAILY
- MONTHLY

---

## Group By

### DAILY

- DATE
- STORE

### MONTHLY

- MONTH
- YEAR
- STORE
- DEPARTMENT

---

## Aggregate

Dropdown:

- SUM
- AVG
- MIN
- MAX

---

# Dynamic Metrics

Metrics change automatically based on report type.

---

## Daily Metrics

- groceryTotal
- volume
- cashDeposit
- checkDeposit
- overShort
- noSale
- lineVoid
- voidAmount
- refunds

---

## Monthly Metrics

- gross
- netSales
- discount
- promotion
- refund
- voidAmount

---

# Dynamic Metric Selector

Provide searchable multi-select.

Example:

- Gross
- Net Sales
- Discount
- Refund
- Promotion
- Void Amount

Users can choose any combination.

---

# Select All / Clear All

Provide:

- Select All
- Clear All

---

# Dynamic Table Generation

No hardcoded columns.

Columns must be generated from selected metrics.

Examples:

Selected Metrics:

- Gross
- Net Sales
- Refund

Generate:

| Month | Gross | Net Sales | Refund |

---

Selected Metrics:

- Gross

Generate:

| Month | Gross |

---

Selected Metrics:

- Gross
- Net Sales
- Discount
- Promotion
- Refund
- Void Amount

Generate all columns.

---

# Column Visibility

After data loads:

User can:

- Hide Gross
- Hide Discount
- Hide Refund

without re-fetching data.

Only affect UI.

---

# Dynamic Charts

Support:

- Line Chart
- Area Chart
- Bar Chart
- Horizontal Bar
- Pie Chart
- Donut Chart
- Grouped Bar
- Stacked Bar
- Multi Line
- Composed Chart

---

# Smart Chart Suggestions

Default Suggestions:

- DATE → Line
- MONTH → Line
- STORE → Horizontal Bar
- DEPARTMENT → Donut
- YEAR → Grouped Bar

User can override.

---

# Filters

Support every backend filter combination.

## Daily Filters

- From Date
- To Date
- Store Selection

## Monthly Filters

- Month
- Year
- Multiple Years
- Department
- Store Selection

## Admin

Support:

- clientId
- storeIds

## Client

Use authenticated store access.

---

# All Possible Analytics Combinations

Support:

## Single Metric

- Gross

## Multiple Metrics

- Gross
- Net Sales
- Refund

## All Metrics

- Gross
- Net Sales
- Discount
- Promotion
- Refund
- Void Amount

---

# Aggregate Analytics

Support:

## SUM

Total values

## AVG

Average values

## MIN

Minimum values

## MAX

Maximum values

---

# Cross Comparisons

Support:

## Store Comparison

Store A vs Store B vs Store C

## Month Comparison

Jan vs Feb vs Mar

## Year Comparison

2024 vs 2025 vs 2026

## Department Comparison

A1 vs B2 vs D5

## Metric Comparison

Gross vs Net Sales vs Refund

---

# KPI Cards

Automatically generate KPI cards.

For each selected metric show:

- Total
- Average
- Minimum
- Maximum
- Growth %

Example:

Gross Sales

- Total
- Average
- Minimum
- Maximum
- Growth %

---

# View Modes

Provide:

## KPI + Chart + Table

## Chart Only

## Table Only

## Split View

Chart on top

Table below

---

# Export Features

Support:

- CSV
- Excel
- PDF
- PNG

---

# Export Rules

Export only visible columns.

Hidden columns should not be exported.

---

# Saved Reports

Allow users to save report configurations.

Example:

{
"reportType":"MONTHLY",
"groupBy":"MONTH",
"metrics":["gross","netSales"],
"aggregate":"SUM",
"years":[2025,2026],
"chartType":"LINE"
}

Support:

- Save Report
- Load Report
- Rename Report
- Delete Report

Use local storage initially.

---

# Data Transformation Layer

Create reusable utilities.

Convert backend response into:

- Chart Data
- Table Data
- CSV Data
- Excel Data
- PDF Data

Avoid duplicate transformation logic.

---

# Performance Requirements

Must support:

- 50+ stores
- 10+ metrics
- Multiple years
- Large datasets

Use:

- React Query
- Memoization
- useMemo
- useCallback
- Lazy Loading
- Code Splitting
- Virtualized Tables
- Query Caching

---

# UI / UX Requirements

Enterprise SaaS quality.

Use:

- Skeleton Loaders
- Smooth Animations
- Tooltips
- Empty States
- Error States
- Sticky Filters
- Sticky Headers
- Responsive Tables
- Dark Mode Compatibility

Must feel premium.

Not like a basic admin dashboard.

---

# Deliverables

Generate output in this exact order:

1. Existing Architecture Analysis
2. Reusable Components Found
3. Files To Modify
4. Files To Create
5. Component Hierarchy
6. Route Changes
7. API Integration Strategy
8. State Management Strategy
9. Data Transformation Strategy
10. UI Wireframes
11. Step-by-Step Implementation Plan
12. Actual Code Changes

Do not generate generic code.

Analyze the codebase first.

Then integrate analytics into the existing architecture using reusable components.
