# Software Requirements Specification — Hands Of Retail Backend API

**Version:** 3.0  
**Date:** 2026-08-05  
**Base URL:** http://localhost:8080  
**Content-Type:** application/json (unless noted otherwise)  
**Auth Scheme:** HttpOnly cookies (`access_token`, and `refresh_token` for the auth endpoints)

> This document is derived from the current controller and DTO implementation in the workspace. It intentionally documents only the endpoints that are present in the code.

---

## 1. Overview

The backend exposes a Spring Boot 3.x REST API for managing stores, clients, store memberships, daily/monthly/yearly reports, fuel types, monthly gas/lottery sales reports, and analytics. All non-auth endpoints require an authenticated user. Admin-only routes require the `ADMIN` role; client-facing routes require the `CLIENT` role and membership in the target store.

### Implemented capabilities

- Authentication and refresh-token lifecycle
- Client account management
- Store management and store-owner assignment
- Store-member management (OWNER/PARTNER)
- Daily report CRUD and filtering
- Monthly report CRUD, filtering, and Excel upload
- Yearly report CRUD and filtering
- Fuel-type management and store fuel-type assignment
- Gas and Lottery sales monthly analytics queries (including "ALL" wildcard metrics)
- Lottery sales monthly report CRUD
- Analytics queries for admin and client roles

---

## 2. Authentication and authorization

### Access model

- The API uses HttpOnly cookies for authentication.
- `access_token` is a JWT cookie used for request authentication.
- `refresh_token` is used only by the auth endpoints to refresh or terminate the session.
- The auth endpoints are under `/api/v1/auth` and are permitted without an existing access token.

### Role rules

| Route prefix             | Required role          | Notes                                                  |
| ------------------------ | ---------------------- | ------------------------------------------------------ |
| `/api/v1/auth/**`        | None                   | Public auth endpoints                                  |
| `/api/v1/admin/**`       | `ADMIN`                | Admin CRUD and management routes                       |
| `/api/v1/client/**`      | `CLIENT`               | Client-scoped read-only routes                         |
| No other operational routes | N/A | All application endpoints are explicitly admin- or client-scoped. |

### Client-scoped access

Client users may only access stores they are linked to through the store-membership mapping. The client controller resolves the current client ID from the authenticated principal and enforces that access.

---

## 3. Common response envelope

Every successful or error response is wrapped in the standard envelope:

```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": { "...": "..." },
  "errors": { "fieldName": "error message" },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

| Field       | Type         | Description                          |
| ----------- | ------------ | ------------------------------------ |
| `success`   | boolean      | `true` on success, `false` on error  |
| `message`   | string       | Human-readable outcome               |
| `data`      | object/array | Payload on success                   |
| `errors`    | object       | Validation errors on `400` responses |
| `timestamp` | string       | Server timestamp                     |

---

## 4. Error handling

| Status | Trigger                                       |
| ------ | --------------------------------------------- |
| `400`  | Validation failure or business-rule rejection |
| `401`  | Missing/invalid authentication                |
| `403`  | Insufficient role or forbidden store access   |
| `404`  | Resource not found                            |
| `409`  | Duplicate resource                            |
| `500`  | Unexpected server error                       |

Validation errors return a payload like:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "must be a well-formed email address"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

---

## 5. Endpoint specifications

### 5.1 Authentication endpoints

#### `POST /api/v1/auth/login`

- Auth: none
- Request body:
  - `email` (string, required, email format)
  - `password` (string, required)
- Response data:
  - `role`
  - `email`
  - `fullName`
- Behavior: sets the `access_token` cookie and the `refresh_token` cookie.

Example request (JSON):

```json
{
  "email": "admin@example.com",
  "password": "P@ssw0rd123"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "role": "ADMIN",
    "email": "admin@example.com",
    "fullName": "Admin User"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `POST /api/v1/auth/refresh`

- Auth: none, but requires a valid `refresh_token` cookie
- Response data: same shape as login
- Behavior: rotates the refresh token and issues a new access token cookie

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "role": "ADMIN",
    "email": "admin@example.com",
    "fullName": "Admin User"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `POST /api/v1/auth/logout`

- Auth: none, but requires a valid `refresh_token` cookie
- Response data: none
- Behavior: revokes the token and clears the auth cookies

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.2 Admin client management

#### `POST /api/v1/admin/clients`

- Auth: `ADMIN`
- Request body:
  - `fullName` (required)
  - `email` (required, valid email)
  - `password` (required)
  - `phoneNumber` (optional)
  - `address` (optional)
- Response data:
  - `clientId`, `fullName`, `email`, `phoneNumber`, `address`, `status`, `role`

Example request (JSON):

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1-555-0102",
  "address": "456 Market Street"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client created",
  "data": {
    "clientId": 2,
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+1-555-0102",
    "address": "456 Market Street",
    "status": "ACTIVE",
    "role": "CLIENT"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/clients`

- Auth: `ADMIN`
- Response data: list of client user objects

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Clients fetched",
  "data": [
    {
      "clientId": 1,
      "fullName": "John Doe",
      "email": "john@example.com",
      "status": "ACTIVE",
      "role": "CLIENT"
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/clients/{id}`

- Auth: `ADMIN`
- Request body: any of the create fields, all optional
- Response data: updated client object

Example request (JSON):

```json
{
  "phoneNumber": "+1-555-0199",
  "address": "789 Oak Avenue"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client updated",
  "data": {
    "clientId": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1-555-0199",
    "address": "789 Oak Avenue",
    "status": "ACTIVE",
    "role": "CLIENT"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PATCH /api/v1/admin/clients/{id}/status`

- Auth: `ADMIN`
- Request body:
  - `status` (`ACTIVE` or `INACTIVE`)

Example request (JSON):

```json
{
  "status": "INACTIVE"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client status updated",
  "data": {
    "clientId": 1,
    "status": "INACTIVE"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.3 Admin store management

#### `POST /api/v1/admin/stores`

- Auth: `ADMIN`
- Request body:
  - `clientId` (required)
  - `storeName` (required)
  - `storeCode` (required)
  - `address` (optional)
  - `contactNumber` (optional)

Example request (JSON):

```json
{
  "clientId": 1,
  "storeName": "Downtown Store",
  "storeCode": "DT-001",
  "address": "123 Main Street",
  "contactNumber": "+1-555-0100"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store created",
  "data": {
    "storeId": 1,
    "clientId": 1,
    "clientName": "John Doe",
    "storeName": "Downtown Store",
    "storeCode": "DT-001",
    "address": "123 Main Street",
    "contactNumber": "+1-555-0100",
    "status": "ACTIVE"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/stores`

- Auth: `ADMIN`
- Optional query params:
  - `clientId`
  - `status`

Example request (JSON):

```json
{
  "clientId": 1,
  "status": "ACTIVE"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Stores fetched",
  "data": [
    {
      "storeId": 1,
      "storeName": "Downtown Store",
      "storeCode": "DT-001",
      "status": "ACTIVE"
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/stores/{storeId}`

- Auth: `ADMIN`
- Response data: single store object

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store fetched",
  "data": {
    "storeId": 1,
    "storeName": "Downtown Store",
    "storeCode": "DT-001",
    "status": "ACTIVE"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PATCH /api/v1/admin/stores/{storeId}/status`

- Auth: `ADMIN`
- Query param:
  - `status` (`ACTIVE` or `INACTIVE`)

Example request (JSON):

```json
{
  "status": "INACTIVE"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store status updated",
  "data": {
    "storeId": 1,
    "status": "INACTIVE"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/stores/{storeId}`

- Auth: `ADMIN`
- Request body: partial store update, including optional `clientId` ownership reassignment

Example request (JSON):

```json
{
  "storeName": "North Branch Store",
  "clientId": 2
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store updated",
  "data": {
    "storeId": 1,
    "storeName": "North Branch Store",
    "clientId": 2,
    "status": "ACTIVE"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.4 Admin store-member management

#### `GET /api/v1/admin/store-members?storeId={id}`

- Auth: `ADMIN`
- Response data: list of store members, each containing:
  - `storeId`, `clientId`, `clientName`, `role`

Example request (JSON):

```json
{
  "storeId": 1
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store members fetched",
  "data": [
    {
      "storeId": 1,
      "clientId": 1,
      "clientName": "John Doe",
      "role": "OWNER"
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `POST /api/v1/admin/store-members`

- Auth: `ADMIN`
- Request body:
  - `storeId` (required)
  - `clientId` (required)
  - `role` (`OWNER` or `PARTNER`)
- Business rules:
  - one owner per store
  - a client-store pair is unique
  - multiple partners are allowed

Example request (JSON):

```json
{
  "storeId": 1,
  "clientId": 2,
  "role": "PARTNER"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store member added",
  "data": {
    "storeId": 1,
    "clientId": 2,
    "clientName": "Jane Doe",
    "role": "PARTNER"
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `DELETE /api/v1/admin/store-members/{storeId}/{clientId}`

- Auth: `ADMIN`
- Business rule: the current owner cannot be removed; ownership must be reassigned first

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store member removed",
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.5 Admin daily reports

#### `POST /api/v1/admin/daily-reports`

- Auth: `ADMIN`
- Request body:
  - `storeId` (required)
  - `reportDate` (required)
  - optional numeric fields: `groceryTotal`, `volume`, `cashDeposit`, `checkDeposit`, `overShort`, `noSale`, `lineVoid`, `voidAmount`, `refunds`

Example request (JSON):

```json
{
  "storeId": 1,
  "reportDate": "2026-08-05",
  "groceryTotal": 1250.5,
  "volume": 3200,
  "cashDeposit": 1100
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Daily report created",
  "data": {
    "dailyReportId": 10,
    "storeId": 1,
    "reportDate": "2026-08-05",
    "groceryTotal": 1250.5,
    "volume": 3200,
    "cashDeposit": 1100
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/daily-reports`

- Auth: `ADMIN`
- Optional query params:
  - `storeId`
  - `clientId`
  - `from` (ISO date)
  - `to` (ISO date)

Example request (JSON):

```json
{
  "storeId": 1,
  "from": "2026-08-01",
  "to": "2026-08-05"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Daily reports fetched",
  "data": [
    {
      "dailyReportId": 10,
      "storeId": 1,
      "reportDate": "2026-08-05",
      "groceryTotal": 1250.5
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/daily-reports/store/{storeId}`

- Auth: `ADMIN`
- Response data: all daily reports for the given store

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store daily reports fetched",
  "data": [
    {
      "dailyReportId": 10,
      "reportDate": "2026-08-05",
      "volume": 3200
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/daily-reports/{dailyReportId}`

- Auth: `ADMIN`
- Request body: partial update of the daily report fields

Example request (JSON):

```json
{
  "voidAmount": 25,
  "refunds": 10
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Daily report updated",
  "data": {
    "dailyReportId": 10,
    "voidAmount": 25,
    "refunds": 10
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.6 Admin monthly reports

#### `POST /api/v1/admin/monthly-reports`

- Auth: `ADMIN`
- Request body:
  - `storeId` (required)
  - `reportMonth` (required)
  - `reportYear` (required)
  - optional fields: `departmentId`, `departmentName`, `gross`, `discount`, `promotion`, `refund`, `voidAmount`, `netSales`

Example request (JSON):

```json
{
  "storeId": 1,
  "reportMonth": 8,
  "reportYear": 2026,
  "departmentId": "D1",
  "departmentName": "Grocery",
  "gross": 25000,
  "netSales": 23000
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Monthly report created",
  "data": {
    "monthlyReportId": 11,
    "storeId": 1,
    "reportMonth": 8,
    "reportYear": 2026,
    "departmentName": "Grocery",
    "gross": 25000,
    "netSales": 23000
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/monthly-reports`

- Auth: `ADMIN`
- Optional query params:
  - `storeId`
  - `clientId`
  - `year`
  - `month`

Example request (JSON):

```json
{
  "storeId": 1,
  "year": 2026,
  "month": 8
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Monthly reports fetched",
  "data": [
    {
      "monthlyReportId": 11,
      "storeId": 1,
      "reportMonth": 8,
      "reportYear": 2026,
      "gross": 25000,
      "netSales": 23000
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/monthly-reports/store/{storeId}`

- Auth: `ADMIN`
- Response data: all monthly reports for the given store

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store monthly reports fetched",
  "data": [
    {
      "monthlyReportId": 11,
      "reportMonth": 8,
      "reportYear": 2026
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/monthly-reports/{monthlyReportId}`

- Auth: `ADMIN`
- Request body: partial update of monthly report fields

Example request (JSON):

```json
{
  "promotion": 500,
  "refund": 120
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Monthly report updated",
  "data": {
    "monthlyReportId": 11,
    "promotion": 500,
    "refund": 120
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `POST /api/v1/admin/monthly-reports/upload`

- Auth: `ADMIN`
- Content type: `multipart/form-data`
- Required form fields:
  - `storeId`
  - `reportMonth`
  - `reportYear`
  - `file`
- Response data:
  - `totalRows`
  - `insertedRows`
  - `deletedRows`

Example request (JSON):

```json
{
  "storeId": 1,
  "reportMonth": 8,
  "reportYear": 2026,
  "file": "monthly-report.xlsx"
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Monthly report upload completed",
  "data": {
    "totalRows": 120,
    "insertedRows": 118,
    "deletedRows": 2
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.7 Admin yearly reports

#### `GET /api/v1/admin/yearly-reports/store/{storeId}`

- Auth: `ADMIN`
- Response data: all yearly reports for the given store

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Yearly reports fetched",
  "data": [
    {
      "yearlyReportId": 7,
      "storeId": 1,
      "reportYear": 2026,
      "annualSummary": 320000
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `POST /api/v1/admin/yearly-reports`

- Auth: `ADMIN`
- Request body:
  - `storeId` (required)
  - `reportYear` (required)
  - `annualSummary` (optional)

Example request (JSON):

```json
{
  "storeId": 1,
  "reportYear": 2026,
  "annualSummary": 320000
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Yearly report created",
  "data": {
    "yearlyReportId": 7,
    "storeId": 1,
    "reportYear": 2026,
    "annualSummary": 320000
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/yearly-reports`

- Auth: `ADMIN`
- Optional query params:
  - `storeId`
  - `clientId`
  - `year`

Example request (JSON):

```json
{
  "storeId": 1,
  "year": 2026
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Yearly reports fetched",
  "data": [
    {
      "yearlyReportId": 7,
      "reportYear": 2026
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/yearly-reports/{yearlyReportId}`

- Auth: `ADMIN`
- Request body: partial yearly report update

Example request (JSON):

```json
{
  "annualSummary": 330000
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Yearly report updated",
  "data": {
    "yearlyReportId": 7,
    "annualSummary": 330000
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.8 Admin fuel-type and store fuel-type management

#### `POST /api/v1/admin/fuel-types`

- Auth: `ADMIN`
- Request body:
  - `fuelName` (required)
  - `active` (optional, boolean)

Example request (JSON):

```json
{
  "fuelName": "Ultra 93",
  "active": true
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Fuel type created",
  "data": {
    "fuelTypeId": 3,
    "fuelName": "Ultra 93",
    "active": true
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/fuel-types/{id}`

- Auth: `ADMIN`
- Request body: updated `fuelName` and `active`

Example request (JSON):

```json
{
  "fuelName": "Premium 93",
  "active": true
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Fuel type updated",
  "data": {
    "fuelTypeId": 3,
    "fuelName": "Premium 93",
    "active": true
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `DELETE /api/v1/admin/fuel-types/{id}`

- Auth: `ADMIN`

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Fuel type deleted",
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/stores/{storeId}/fuel-types`

- Auth: `ADMIN`
- Request body:
  - `fuelTypeIds` (required list of IDs)
- Behavior: replaces the fuel-type mapping for the store

Example request (JSON):

```json
{
  "fuelTypeIds": [1, 3]
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store fuel types updated",
  "data": {
    "storeId": 1,
    "fuelTypeIds": [1, 3]
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.9 Authenticated query endpoints

#### `GET /api/v1/admin/fuel-types`

- Auth: `ADMIN`
- Response data: list of active fuel types with `fuelTypeId`, `fuelName`, `active`

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Fuel types fetched",
  "data": [
    {
      "fuelTypeId": 1,
      "fuelName": "Regular 87",
      "active": true
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/fuel-types/{id}`

- Auth: `ADMIN`
- Response data: single fuel type object

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Fuel type fetched",
  "data": {
    "fuelTypeId": 1,
    "fuelName": "Regular 87",
    "active": true
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/stores/{storeId}/fuel-types`

- Auth: `ADMIN`
- Response data: list of fuel types assigned to a store

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Store fuel types fetched",
  "data": [
    {
      "fuelTypeId": 1,
      "fuelName": "Regular 87",
      "active": true
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/gas-sales/monthly`

- Auth: `ADMIN`
- Optional query params:
  - `storeId`
  - `month`
  - `year`
- Behavior: if both `month` and `year` are provided, the endpoint returns reports for that period; otherwise it returns the full list ordered by year and month descending

Example request (JSON):

```json
{
  "storeId": 1,
  "month": 8,
  "year": 2026
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Gas sales reports fetched",
  "data": [
    {
      "reportId": 4,
      "storeId": 1,
      "reportMonth": 8,
      "reportYear": 2026,
      "totalVolumeSold": 5200
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/gas-sales/monthly/{id}`

- Auth: `ADMIN`
- Response data: single gas sales monthly report with nested detail rows

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Gas sales report fetched",
  "data": {
    "reportId": 4,
    "storeId": 1,
    "reportMonth": 8,
    "reportYear": 2026,
    "details": [
      {
        "fuelType": "Regular 87",
        "volume": 5000
      }
    ]
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `POST /api/v1/admin/lottery-sales/monthly`

- Auth: `ADMIN`
- Request body:
  - `storeId`
  - `reportMonth`
  - `reportYear`
  - `onlineSales`
  - `scratchOffSales`
  - `onlineCashes`
  - `scratchOffCashes`
  - `commission`

Example request (JSON):

```json
{
  "storeId": 1,
  "reportMonth": 8,
  "reportYear": 2026,
  "onlineSales": 4500,
  "scratchOffSales": 1800,
  "onlineCashes": 1000,
  "scratchOffCashes": 300,
  "commission": 250
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Lottery sales report created",
  "data": {
    "reportId": 8,
    "storeId": 1,
    "reportMonth": 8,
    "reportYear": 2026,
    "onlineSales": 4500,
    "commission": 250
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/admin/lottery-sales/monthly`

- Auth: `ADMIN`
- Optional query params:
  - `storeId`
  - `month`
  - `year`

Example request (JSON):

```json
{
  "storeId": 1,
  "month": 8,
  "year": 2026
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Lottery sales reports fetched",
  "data": [
    {
      "reportId": 8,
      "storeId": 1,
      "reportMonth": 8,
      "reportYear": 2026,
      "onlineSales": 4500
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `PUT /api/v1/admin/lottery-sales/monthly/{reportId}`

- Auth: `ADMIN`
- Request body: same shape as create

Example request (JSON):

```json
{
  "onlineSales": 4700,
  "commission": 300
}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Lottery sales report updated",
  "data": {
    "reportId": 8,
    "onlineSales": 4700,
    "commission": 300
  },
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `DELETE /api/v1/admin/lottery-sales/monthly/{reportId}`

- Auth: `ADMIN`
- Deletes the report by ID

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Lottery sales report deleted",
  "timestamp": "2026-08-05T12:00:00Z"
}
```

### 5.10 Client endpoints

#### `GET /api/v1/client/stores`

- Auth: `CLIENT`
- Response data: list of stores the authenticated client belongs to

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client stores fetched",
  "data": [
    {
      "storeId": 1,
      "storeName": "Downtown Store",
      "storeCode": "DT-001"
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/client/daily-reports/store/{storeId}`

- Auth: `CLIENT`
- Response data: daily reports for the requested store, filtered to the client’s allowed stores

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client daily reports fetched",
  "data": [
    {
      "dailyReportId": 10,
      "reportDate": "2026-08-05",
      "groceryTotal": 1250.5
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/client/monthly-reports/store/{storeId}`

- Auth: `CLIENT`
- Response data: monthly reports for the requested store, filtered to the client’s allowed stores

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client monthly reports fetched",
  "data": [
    {
      "monthlyReportId": 11,
      "reportMonth": 8,
      "reportYear": 2026,
      "gross": 25000
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

#### `GET /api/v1/client/yearly-reports/store/{storeId}`

- Auth: `CLIENT`
- Response data: yearly reports for the requested store, filtered to the client’s allowed stores

Example request (JSON):

```json
{}
```

Example response (JSON):

```json
{
  "success": true,
  "message": "Client yearly reports fetched",
  "data": [
    {
      "yearlyReportId": 7,
      "reportYear": 2026,
      "annualSummary": 320000
    }
  ],
  "timestamp": "2026-08-05T12:00:00Z"
}
```

---

## 6. Business rules

- Store codes are unique.
- A store has exactly one owner and can have many partners.
- A client-store pair is unique.
- Client users can only see reports for stores they are assigned to.
- Monthly upload replaces existing data for the same store/month/year combination and returns the number of inserted and deleted rows.
- Fuel-type assignment is replaced wholesale for a store when the admin updates the mapping.

---

## 7. Notes

- Analytics endpoints are documented separately in the analytics SRS because they use a different request/response shape.
- The implementation is based on the current controller layer and therefore does not document any endpoints that are not present in the source code.
