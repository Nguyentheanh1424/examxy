# API Flow - Authentication

## When to use this flow

This document is used to understand the API call sequence for:

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

- `login` returns `403` when the email is not confirmed.
- `register` and `register/student` return `409` when the username or email already exists.
- `refresh-token` returns `401` or `404` when the token pair is invalid.
- `forgot-password` and `resend-email-confirmation` follow privacy-safe behavior, so they may still return `204` even when no email is sent.
