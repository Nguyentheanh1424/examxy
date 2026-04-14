# API Flow - Authentication

## When to use this flow

Doc nay dung khi can hieu trinh tu goi API cho:

- teacher self-signup
- student self-signup
- confirm email
- login
- forgot/reset password
- refresh token
- logout

## Teacher register -> confirm email -> login

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Auth as Auth API
    participant Identity as Identity Services
    participant Email as Email Sender

    Client->>Auth: POST /api/auth/register
    Auth->>Identity: create Teacher account + TeacherProfile
    Identity->>Email: send confirmation email
    Auth-->>Client: 200 AuthResponseDto (primaryRole=Teacher)
    Client->>Auth: POST /api/auth/confirm-email
    Auth->>Identity: validate URL-safe token
    Auth-->>Client: 204 No Content
    Client->>Auth: POST /api/auth/login
    Auth->>Identity: validate credentials + email confirmed
    Auth-->>Client: 200 AuthResponseDto
```

## Student self-signup -> dashboard

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Auth as Auth API
    participant Student as Student Onboarding Service
    participant Dashboard as Student Dashboard API

    Client->>Auth: POST /api/auth/register/student
    Auth->>Student: create Student account + StudentProfile
    Auth-->>Client: 200 AuthResponseDto (primaryRole=Student)
    Client->>Dashboard: GET /api/student/dashboard
    Dashboard-->>Client: 200 StudentDashboardDto
```

## Forgot password -> reset password

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Auth as Auth API
    participant Account as Account Service
    participant Email as Email Sender

    Client->>Auth: POST /api/auth/forgot-password
    Auth->>Account: privacy-safe lookup
    Account->>Email: send reset email when eligible
    Auth-->>Client: 204 No Content
    Client->>Auth: POST /api/auth/reset-password
    Auth->>Account: validate URL-safe token + save new password
    Auth-->>Client: 204 No Content
```

## Refresh token -> logout

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Auth as Auth API
    participant Tokens as Token Services

    Client->>Auth: POST /api/auth/refresh-token
    Auth->>Tokens: validate + rotate refresh token
    Auth-->>Client: 200 AuthResponseDto
    Client->>Auth: POST /api/auth/logout
    Auth->>Tokens: revoke submitted refresh token
    Auth-->>Client: 204 No Content
```

## Related endpoints

- `POST /api/auth/register`
- `POST /api/auth/register/student`
- `POST /api/auth/login`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/confirm-email`
- `POST /api/auth/resend-email-confirmation`

## Failure points

- `login` tra `403` khi email chua duoc confirm.
- `register` va `register/student` tra `409` khi username hoac email da ton tai.
- `refresh-token` tra `401` hoac `404` khi token pair khong hop le.
- `forgot-password` va `resend-email-confirmation` giu behavior privacy-safe, nen van tra `204` trong nhieu truong hop khong gui email.
