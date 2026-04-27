# API Flow - Internal Admin

## When to use this flow

This document is used for internal operational flows:

- provision admin accounts
- audit identity integrity
- repair/backfill/migrate identity data

All endpoints in this document require a shared secret header from `InternalAdminProvisioning`.

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

- Missing or invalid shared secret header returns `403`.
- Provision admin returns `409` if username or email already exists.
- Maintenance endpoints are internal-only operational tools, not part of the public client contract.
