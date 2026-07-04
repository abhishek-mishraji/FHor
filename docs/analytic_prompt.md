# Hands Of Retail - Analytics Module Redesign (Monthly Comparison V1)

## AI ROLE

You are an elite Staff Software Engineer, Principal React Architect, Senior UI/UX Designer, Enterprise SaaS Architect, Product Designer, and Business Intelligence (BI) Dashboard Expert with more than 15 years of experience building enterprise analytics platforms.

You have designed products similar to:

- Microsoft Power BI
- Tableau
- SAP Analytics Cloud
- Oracle Analytics
- IBM Cognos
- Looker
- Metabase
- Salesforce CRM Analytics
- Amazon QuickSight

You are also an expert in:

- Enterprise React Architecture
- TypeScript
- Component Design
- Business Intelligence
- Retail Analytics
- Financial Reporting
- UX Research
- Data Grid Design
- Enterprise Table Design
- Scalable Frontend Architecture
- Information Architecture
- Human Computer Interaction
- Performance Optimization
- Clean Code
- SOLID Principles

You never build beginner-level CRUD pages.

You always think like:

- CEO
- Regional Manager
- Store Manager
- Financial Analyst
- Accountant
- Retail Operations Team

Every design decision must help users answer business questions quickly.

If you identify a better UX than my suggestion, explain why and implement the better solution while keeping backend compatibility.

---

# PROJECT OBJECTIVE

Completely remove the existing Analytics module.

Do NOT reuse the existing Analytics pages.

Delete:

- Analytics pages
- Analytics components
- Analytics CSS
- Analytics hooks
- Analytics services
- Analytics utilities
- Analytics routes
- Dead code

Rebuild the Analytics module completely from scratch.

Keep only:

- Authentication
- Existing Layout
- Sidebar
- Routing
- Theme
- Shared Components (only if reusable)

Everything else should be redesigned.

---

# BACKEND

I will provide:

- Analytics_API_SRS.md
- Backend_API_SRS.md

You MUST follow those APIs exactly.

Do NOT modify backend contracts.

Do NOT assume missing endpoints.

Do NOT invent APIs.

The backend already supports:

- Dynamic metrics
- Dynamic grouping
- SUM
- AVG
- MIN
- MAX
- Multiple years
- Department grouping
- Monthly reports
- Dynamic datasets

Use those capabilities exactly as designed. The analytics endpoint supports configurable grouping, metrics, aggregation, and returns a generic `labels[]` + `datasets[]` response suitable for frontend transformation.

---

# VERSION 1 SCOPE

Only Monthly Analytics.

NO Daily Analytics.

NO Yearly Analytics page.

NO Charts.

NO Graphs.

NO KPI Cards.

NO Dashboard Cards.

NO Pie Charts.

NO Line Charts.

NO Bar Charts.

NO Heatmaps.

NO Sparklines.

Everything should be Table Based.

Think of this module as an Enterprise Financial Report instead of a Dashboard.

---

# BUSINESS GOAL

The Analytics page should answer questions such as:

Which month performed better?

How much did Net Sales increase?

What is the percentage difference?

Which department dropped?

Which department improved?

Which month has the highest value?

Which month has the lowest value?

What is the average?

What is the maximum?

What is the minimum?

What is the total?

Every answer should be understandable directly from tables.

---

# UI DESIGN PHILOSOPHY

The interface must feel like enterprise software.

Use inspiration from:

- SAP
- Oracle ERP
- Microsoft Dynamics
- Banking Systems
- Financial Reporting Software

Avoid:

- Fancy animations
- Oversized cards
- Colorful dashboards
- Template-style admin panels
- Toy-like interfaces

Focus on:

- Readability
- Information Density
- Professional Typography
- Consistent Spacing
- Clean White Space
- Excellent UX

---

# ANALYTICS PAGE STRUCTURE

Analytics

↓

Sticky Filter Toolbar

↓

Comparison Type

↓

Dynamic Table

↓

Summary Table

↓

Export

No other sections are required in V1.

---

# FILTER TOOLBAR

The filter bar should stay visible while scrolling.

Include:

Store

Comparison Type

Current Month

Comparison Month

Year

Department

Aggregation

Metrics

Buttons:

Compare

Reset

Export

Save View (disabled placeholder)

---

# STORE

Single Store only.

Do NOT support multiple store comparison.

---

# COMPARISON TYPES

Implement these comparison modes.

## 1. Month over Month (Sequential)

Each month compares with its previous month.

Example:

Jan

Feb vs Jan

Mar vs Feb

Apr vs Mar

Table:

Month

Current

Previous

Difference

% Difference

Trend

---

## 2. One Month vs Many Months

Reference Month:

June

Compare against:

All Months

OR

Selected Months

Table:

Month

Current

Reference

Difference

% Difference

---

## 3. Selected Months (Sequential)

Example:

User selects:

March

April

May

June

Results:

March

April vs March

May vs April

June vs May

---

## 4. Year over Year

Example:

June 2024

June 2025

June 2026

Table:

Year

Current

Difference

% Difference

---

## 5. Department Comparison

One Month

All Departments

Table:

Department

Current

Previous

Difference

% Difference

---

## 6. Metric Comparison

Compare metrics within one month.

Example:

Gross

Discount

Promotion

Refund

Void Amount

Net Sales

Table:

Metric

Previous

Current

Difference

% Difference

---

# DYNAMIC COLUMN SELECTION

Allow users to choose visible columns.

Example:

☑ Gross

☑ Discount

☑ Promotion

☑ Refund

☑ Void Amount

☑ Net Sales

☑ Difference

☑ % Difference

Only selected columns should appear.

The table must rebuild dynamically.

---

# TABLE FEATURES

Build one reusable enterprise table component.

Every table must support:

Sticky Header

Sticky First Column

Horizontal Scroll

Column Resize

Column Sorting

Column Visibility

Search

Pagination

Loading Skeleton

Empty State

Error State

Responsive Layout

Professional Styling

Future extensibility

---

# DIFFERENCE CALCULATION

Difference

Current - Previous

---

# PERCENTAGE CALCULATION

(Current - Previous)

/

Previous

×

100

Handle divide-by-zero safely.

Display "-" when percentage cannot be calculated.

---

# COLOR RULES

Positive Net Sales

Green

Negative Net Sales

Red

Positive Discount

Red

Negative Discount

Green

Positive Refund

Red

Negative Refund

Green

Positive Void Amount

Red

Negative Void Amount

Green

This logic should be centralized.

---

# SUMMARY TABLE

Below every comparison table display another table.

Example

| Summary |  Current | Previous |
| ------- | -------: | -------: |
| SUM     | ₹850,000 | ₹790,000 |
| AVERAGE | ₹141,667 | ₹131,667 |
| MINIMUM | ₹110,000 |  ₹98,000 |
| MAXIMUM | ₹175,000 | ₹160,000 |

Support all backend aggregation types:

- SUM
- AVG
- MIN
- MAX

The selected aggregation should integrate with the backend analytics API where supported.

---

# EXPORT

Prepare UI for:

Excel

CSV

PDF

Implementation can be placeholder.

---

# COMPONENT STRUCTURE

Analytics/

pages/

components/

ComparisonToolbar/

ComparisonTypeSelector/

MetricSelector/

ColumnSelector/

ComparisonTable/

SummaryTable/

AggregationSelector/

ExportActions/

hooks/

services/

types/

utils/

constants/

Everything should be reusable.

---

# DEVELOPMENT RULES

Before writing code:

1. Analyze backend APIs.
2. Analyze existing frontend.
3. Remove obsolete Analytics code.
4. Design new folder structure.
5. Design reusable components.
6. Design state management.
7. Design API integration.
8. Design table architecture.
9. Present the complete architecture and implementation plan.
10. Wait for approval.
11. Then start implementation.

Do not immediately write code.

---

# CODE QUALITY

Use:

- SOLID Principles
- Clean Architecture
- Reusable Components
- Custom Hooks
- Separation of Concerns
- Performance Optimization
- Memoization where appropriate
- Lazy Loading where appropriate
- Excellent Type Safety (if TypeScript exists)

Avoid duplicated logic.

---

# USER EXPERIENCE

The page should feel like a premium enterprise financial reporting application.

It should impress clients during demos.

Every interaction should reduce clicks and make comparisons easier.

Always optimize for:

- Readability
- Speed
- Maintainability
- Scalability
- Business usability

---

# FINAL DELIVERABLE

Deliver a completely redesigned Analytics module that is:

- Production Ready
- Enterprise Grade
- Fully Responsive
- Clean Architecture
- Table First
- Backend Compatible
- Scalable for future Chart Analytics
- Easy to maintain
- Easy to extend

Do not implement any charts in Version 1.

Focus entirely on professional comparison tables, dynamic filtering, percentage differences, aggregation, and enterprise user experience.
