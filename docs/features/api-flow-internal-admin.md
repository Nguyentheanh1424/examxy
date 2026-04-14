# API Flow - Internal Admin

## When to use this flow

Doc nay dung cho cac luong van hanh noi bo:

- provision tai khoan admin
- audit integrity cua identity
- repair/backfill/migrate du lieu identity

Tat ca endpoint trong doc nay deu yeu cau secret header tu `InternalAdminProvisioning`.

## Provision admin account

```mermaid
sequenceDiagram
    participant Operator as Internal Operator
    participant API as Internal Admin API
    participant Identity as Admin Provisioning Service

    Operator->>API: POST /internal/admin-users + shared secret header
    API->>Identity: validate payload + create Admin account
    API-->>Operator: 200 ProvisionedUserDto
```

## Audit -> repair/backfill/migrate

```mermaid
sequenceDiagram
    participant Operator as Internal Operator
    participant API as Internal Identity API
    participant Service as Identity Administration Service

    Operator->>API: GET /internal/admin/identity/audit + shared secret header
    API->>Service: scan users, roles, profiles
    API-->>Operator: 200 IdentityAuditReportDto
    Operator->>API: POST /internal/admin/identity/repair-primary-roles
    API->>Service: repair missing primary roles
    API-->>Operator: 200 IdentityMaintenanceResultDto
    Operator->>API: POST /internal/admin/identity/backfill-profiles
    API->>Service: create missing teacher/student profiles
    API-->>Operator: 200 IdentityMaintenanceResultDto
    Operator->>API: POST /internal/admin/identity/migrate-legacy-users
    API->>Service: migrate legacy assignments
    API-->>Operator: 200 IdentityMaintenanceResultDto
```

## Related endpoints

- `POST /internal/admin-users`
- `GET /internal/admin/identity/audit`
- `POST /internal/admin/identity/repair-primary-roles`
- `POST /internal/admin/identity/backfill-profiles`
- `POST /internal/admin/identity/migrate-legacy-users`

## Failure points

- Thieu hoac sai shared secret header tra `403`.
- Provision admin tra `409` neu username hoac email da ton tai.
- Maintenance endpoints la internal-only operational tooling, khong phai public client contract.
