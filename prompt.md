Act as an Elite Software Development Engineer (SDE) with 15+ years of experience in full-stack architecture, specializing in Spring Boot 3.x for the backend and React 19 (Vite) for the frontend. 

Your task is to completely implement, fix, and wire up two major new features across the entire stack: **Lottery Sales** and **Gas Sales** (both CRUD operations and their respective Analytics integrations). The user has reported that "nothing is working," so your job is to review the current state, implement the missing pieces, and ensure flawless execution.

---

### 1. Database Schema Context
Here are the relevant tables you need to work with:

```text
LOTTERY_SALES_REPORTS_MONTHLY {
    Long lottery_sales_report_monthly_id PK
    Long store_id FK
    Integer report_month
    Integer report_year
    BigDecimal online_sales
    BigDecimal scratch_off_sales
    BigDecimal online_cashes
    BigDecimal scratch_off_cashes
    BigDecimal commission
}

FUEL_TYPES {
    Long fuel_type_id PK
    String fuel_name UK
    Boolean active
}

STORE_FUEL_TYPES {
    Long store_fuel_type_id PK
    Long store_id FK
    Long fuel_type_id FK
    Boolean active
}

GAS_SALES_REPORTS_MONTHLY {
    Long gas_sales_report_monthly_id PK
    Long store_id FK
    Integer report_month
    Integer report_year
    BigDecimal credit_fees
    BigDecimal total_volume_sold
    BigDecimal net_profit_per_gallon
    BigDecimal net_profit
}

GAS_SALES_REPORT_DETAILS {
    Long gas_sales_report_detail_id PK
    Long gas_sales_report_monthly_id FK
    Long fuel_type_id FK
    BigDecimal volume_sold
    BigDecimal profit_per_gallon
}
```

---

### 2. Backend API Requirements (CRUD)

All responses must be wrapped in the standard envelope:
`{ "success": true, "message": "...", "data": {}, "errors": null, "timestamp": "..." }`

**A. Lottery Sales CRUD (`/api/v1/admin/lottery-sales/monthly`)**
- **POST**: Create a report (storeId, reportMonth, reportYear, onlineSales, scratchOffSales, onlineCashes, scratchOffCashes, commission).
- **GET**: Fetch reports (optional params: storeId, month, year).
- **PUT** `/{reportId}`: Update report.
- **DELETE** `/{reportId}`: Delete report.

**B. Fuel Types Management (`/api/v1/admin/fuel-types` & `/stores`)**
- **POST / PUT / DELETE** `/api/v1/admin/fuel-types`: Manage global fuel types (fuelName, active).
- **PUT** `/api/v1/admin/stores/{storeId}/fuel-types`: Assign a list of `fuelTypeIds` to a specific store.
- **GET** `/api/v1/admin/stores/{storeId}/fuel-types`: Fetch fuel types assigned to a store.

**C. Gas Sales CRUD (`/api/v1/admin/gas-sales/monthly`)**
- **GET**: Fetch gas reports. If `{id}` is provided, return the report with its nested `details` (array of `GAS_SALES_REPORT_DETAILS`).
- Implement the POST/PUT operations to handle saving a gas report along with its nested detail rows per fuel type.

---

### 3. Backend Analytics API Requirements

Ensure the `/api/v1/admin/analytics/reports` and `/api/v1/client/analytics/reports` endpoints support both new report types. For both, exactly one `storeId` is required, and requests must include `comparisonAMonth`, `comparisonAYear`, `comparisonBMonth`, and `comparisonBYear`. The response dataset must include `valueA`, `valueB`, `difference`, and `percentageDifference`.

**A. `LOTTERY_MONTHLY` Analytics**
- **groupBy**: `MONTH`
- **metrics**: `ONLINE_SALES`, `SCRATCH_OFF_SALES`, `ONLINE_CASHES`, `SCRATCH_OFF_CASHES`, `COMMISSION`, `ALL`.

**B. `GAS_MONTHLY` Analytics**
- **groupBy**: `MONTH`
- **metrics**: `CREDIT_FEES`, `TOTAL_VOLUME_SOLD`, `NET_PROFIT`, `NET_PROFIT_PER_GALLON`, `ALL`.
- **Dynamic Detail Metrics**: Must support dynamically querying specific fuel types using the format `DETAIL_VOLUME_SOLD_{fuelTypeId}` and `DETAIL_PROFIT_{fuelTypeId}`.

---

### 4. Frontend Integration Requirements

- **Fuel Types Admin UI**: Create a way for admins to manage `Fuel Types` and assign them to stores. (Currently missing from the UI).
- **Gas Sales Page (`src/pages/GasSales/GasSalesPage.jsx`)**: Ensure the form properly fetches the store's assigned fuel types, allows the user to input volume/profit details per fuel type, and correctly sends the nested payload to the backend.
- **Lottery Sales Page (`src/pages/LotterySales/LotterySalesPage.jsx`)**: Ensure data table, create/edit modals, and deletions are fully functional and properly call `lotteryService.js`.
- **Analytics Page (`src/pages/Analytics/AnalyticsPage.jsx`)**: Ensure the `useComparisonQuery` hook passes the correct comparison month/year parameters for both `LOTTERY_MONTHLY` and `GAS_MONTHLY` modes. Ensure the dynamic fuel type detail metrics are properly parsed into human-readable labels (e.g., "Volume Sold (Regular Unleaded)").

---

### 5. Execution Plan
Before writing any code, please provide a concise, step-by-step checklist of the files you will create or modify across the Spring Boot backend and React frontend. Once I approve, implement the code with extreme attention to edge cases, validation, and error handling.
