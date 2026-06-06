# Authentication And Authorization Diagrams

## 1. ER Diagram

```mermaid
erDiagram
    ADMIN_USERS ||--o{ REFRESH_TOKENS : "user_email"
    CLIENT_USERS ||--o{ REFRESH_TOKENS : "user_email"
    CLIENT_USERS ||--o{ CLIENT_STORE_MAPPING : "client_id"
    STORES ||--o{ CLIENT_STORE_MAPPING : "store_id"

    ADMIN_USERS {
        bigint admin_id PK
        string full_name
        string email
        string password_hash
        string role
        timestamp created_at
        timestamp updated_at
    }

    CLIENT_USERS {
        bigint client_id PK
        string full_name
        string email
        string password_hash
        string status
        string role
        timestamp created_at
        timestamp updated_at
    }

    REFRESH_TOKENS {
        bigint id PK
        string token_hash
        string user_email
        string user_role
        timestamp expires_at
        boolean revoked
        timestamp created_at
    }

    STORES {
        bigint store_id PK
        string store_name
        string store_code
        string address
        string contact_number
        string status
        timestamp created_at
        timestamp updated_at
    }

    CLIENT_STORE_MAPPING {
        bigint client_id PK, FK
        bigint store_id PK, FK
        string role
        timestamp created_at
        timestamp updated_at
    }
```

## 2. Authentication Architecture Diagram

```mermaid
flowchart LR
    Browser[Browser or API Client]
    CookieJar[HttpOnly Cookies]
    Security[Spring Security Filter Chain]
    JwtFilter[JwtAuthenticationFilter]
    AuthController[AuthController]
    AppControllers[Protected Controllers]
    AuthService[AuthService]
    TokenService[TokenService]
    AdminRepo[AdminUserRepository]
    ClientRepo[ClientUserRepository]
    RefreshRepo[RefreshTokenRepository]
    Postgres[(PostgreSQL)]

    Browser --> CookieJar
    CookieJar --> Security
    Security --> JwtFilter
    JwtFilter --> AuthController
    JwtFilter --> AppControllers
    AuthController --> AuthService
    AppControllers --> AuthService
    AuthService --> TokenService
    AuthService --> AdminRepo
    AuthService --> ClientRepo
    TokenService --> RefreshRepo
    AdminRepo --> Postgres
    ClientRepo --> Postgres
    RefreshRepo --> Postgres

    AccessNote[Access token is JWT in HttpOnly cookie]
    RefreshNote[Refresh token is rotated and stored hashed in database]
    StatelessNote[Access token is validated without database lookup]

    CookieJar --- AccessNote
    RefreshRepo --- RefreshNote
    JwtFilter --- StatelessNote
```

## 3. Login Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser
    participant Controller as AuthController
    participant Service as AuthService
    participant AdminRepo as ADMIN_USERS
    participant ClientRepo as CLIENT_USERS
    participant TokenService as TokenService
    participant RefreshRepo as REFRESH_TOKENS

    User->>Controller: POST /api/v1/auth/login
    Controller->>Service: login(email, password)
    Service->>AdminRepo: findByEmail(email)
    AdminRepo-->>Service: admin user or null

    alt User found in ADMIN_USERS
        Service->>Service: verify password with BCrypt
        Note over Service: role = ADMIN
    else Not found in ADMIN_USERS
        Service->>ClientRepo: findByEmail(email)
        ClientRepo-->>Service: client user or null

        alt User found in CLIENT_USERS
            Service->>Service: verify password with BCrypt
            Note over Service: role = CLIENT
        else User not found
            Service-->>Controller: UnauthorizedException
            Controller-->>User: 401 Invalid email or password
        end
    end

    Service->>TokenService: generate access token JWT
    Service->>TokenService: generate refresh token
    TokenService->>RefreshRepo: store hashed refresh token
    RefreshRepo-->>TokenService: saved
    TokenService-->>User: Set access_token cookie
    TokenService-->>User: Set refresh_token cookie
    Controller-->>User: 200 Login successful
```

## 4. Refresh Token Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser
    participant Controller as AuthController
    participant Service as AuthService
    participant TokenService as TokenService
    participant RefreshRepo as REFRESH_TOKENS

    User->>Controller: POST /api/v1/auth/refresh
    Note over User,Controller: refresh_token cookie is sent automatically
    Controller->>Service: refresh(request, response)
    Service->>TokenService: validate refresh token from cookie
    TokenService->>RefreshRepo: find token hash
    RefreshRepo-->>TokenService: token record

    alt Refresh token valid and active
        TokenService->>RefreshRepo: revoke old token
        TokenService->>TokenService: create new refresh token
        TokenService->>RefreshRepo: store new token hash
        TokenService->>TokenService: generate new access token JWT
        TokenService-->>User: Set new refresh_token cookie
        TokenService-->>User: Set new access_token cookie
        Controller-->>User: 200 Token refreshed
    else Token invalid or expired
        Controller-->>User: 401 Refresh token invalid or expired
    end
```

## 5. Logout Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser
    participant Controller as AuthController
    participant Service as AuthService
    participant TokenService as TokenService
    participant RefreshRepo as REFRESH_TOKENS

    User->>Controller: POST /api/v1/auth/logout
    Note over User,Controller: refresh_token cookie is sent automatically
    Controller->>Service: logout(request, response)
    Service->>TokenService: validate refresh token
    TokenService->>RefreshRepo: find token hash
    RefreshRepo-->>TokenService: token record
    TokenService->>RefreshRepo: revoke active refresh tokens for user
    TokenService-->>User: Clear access_token cookie
    TokenService-->>User: Clear refresh_token cookie
    Controller-->>User: 200 Logged out successfully
```

## 6. Authorization Flow Diagram

```mermaid
flowchart TD
    Request[Protected Request]
    Cookie[Browser sends access_token cookie]
    Filter[JwtAuthenticationFilter]
    Validate[Validate JWT signature and expiry]
    Extract[Extract email and role]
    Context[Populate SecurityContext]
    RoleCheck{Role allowed for endpoint}
    ClientCheck{Client store mapping exists}
    Allow[Allow controller execution]
    Deny401[Return 401 Unauthorized]
    Deny403[Return 403 Forbidden]
    MappingRepo[CLIENT_STORE_MAPPING lookup]

    Request --> Cookie --> Filter --> Validate
    Validate -->|Invalid or expired| Deny401
    Validate -->|Valid| Extract --> Context --> RoleCheck
    RoleCheck -->|ADMIN route allowed| Allow
    RoleCheck -->|CLIENT route| ClientCheck
    RoleCheck -->|Role mismatch| Deny403
    ClientCheck --> MappingRepo
    MappingRepo --> ClientCheck
    ClientCheck -->|Mapping exists| Allow
    ClientCheck -->|Mapping missing| Deny403
```

## 7. RBAC Diagram

```mermaid
flowchart LR
    AdminRole[Role: ADMIN]
    ClientRole[Role: CLIENT]

    AdminAccess[Full platform access]
    ManageClients[Manage clients]
    ManageStores[Manage stores]
    UploadReports[Upload reports]
    ViewAllReports[View all reports]

    ClientAccess[Restricted business access]
    AssignedStores[Access assigned stores only]
    ViewAssignedReports[View reports for assigned stores]
    OwnerPartner[Store membership through OWNER or PARTNER]

    Mapping[CLIENT_STORE_MAPPING]

    AdminRole --> AdminAccess
    AdminRole --> ManageClients
    AdminRole --> ManageStores
    AdminRole --> UploadReports
    AdminRole --> ViewAllReports

    ClientRole --> ClientAccess
    ClientRole --> AssignedStores
    ClientRole --> ViewAssignedReports
    ClientRole --> OwnerPartner
    OwnerPartner --> Mapping
```

## 8. Security Component Diagram

```mermaid
flowchart TB
    subgraph ClientSide[Client Side]
        Browser[Browser]
        AccessCookie[access_token cookie]
        RefreshCookie[refresh_token cookie]
    end

    subgraph SecurityLayer[Spring Security Layer]
        FilterChain[SecurityFilterChain]
        JwtFilter[JwtAuthenticationFilter]
        SecurityContext[SecurityContext]
    end

    subgraph ApplicationLayer[Application Layer]
        AuthController[AuthController]
        ProtectedController[Protected Controllers]
        AuthService[AuthService]
        TokenService[TokenService]
    end

    subgraph DataLayer[Persistence Layer]
        AdminRepo[ADMIN_USERS repository]
        ClientRepo[CLIENT_USERS repository]
        RefreshRepo[REFRESH_TOKENS repository]
        Database[(PostgreSQL)]
    end

    Browser --> AccessCookie
    Browser --> RefreshCookie
    AccessCookie --> FilterChain
    RefreshCookie --> AuthController
    FilterChain --> JwtFilter --> SecurityContext
    SecurityContext --> ProtectedController
    AuthController --> AuthService
    ProtectedController --> AuthService
    AuthService --> TokenService
    AuthService --> AdminRepo
    AuthService --> ClientRepo
    TokenService --> RefreshRepo
    AdminRepo --> Database
    ClientRepo --> Database
    RefreshRepo --> Database
```
