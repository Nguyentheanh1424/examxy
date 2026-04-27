# Authentication Backend Gaps For Client Login

## Objective

The frontend `/login` already provides a new end-user experience:

- two-column layout with product introduction content
- `Remember me` handled entirely on the client
- social buttons `Google` / `Facebook` currently show placeholder popups

This document outlines the missing backend pieces so the frontend can move from placeholder popups to real external authentication and reduce reliance on mapping based on message text.

## What the backend is missing

### 0. Server-side contract for `Remember me`

Current state:

- FE already has a `Remember me` checkbox
- this behavior is currently client-only persistence
- BE does not receive a `rememberMe` field and does not differentiate refresh-token policy based on it

If this is later turned into a full-stack behavior, at minimum consider:

- adding `rememberMe` to the login request
- clearly defining persistent vs non-persistent session behavior on the backend
- deciding whether refresh token lifetime depends on this flag
- adding tests for login/refresh/logout in both modes

Until then, `Remember me` should be treated as a browser persistence toggle, not a server session mode.

### 1. External auth / social login

Currently, the backend only supports password-based authentication:

- `register`
- `login`
- `refresh-token`
- `logout`
- `me`
- password + email flows

There is no trace in the repo of:

- `AddGoogle`
- `AddFacebook`
- external auth challenge/callback endpoints
- account linking flow for external providers

Without this, FE should keep social buttons as informational popups and cannot perform real login via Google/Facebook.

### 2. Machine-readable auth error codes for login states

FE needs to map certain login errors to user-friendly messages. Backend already has general status codes (`401`, `403`, `409`) but lacks stable error codes that FE can map without relying on message strings.

At minimum, introduce codes for:

- `invalid_credentials`
- `email_confirmation_required`
- `account_locked`
- `external_auth_not_configured`
- `external_auth_failed`

Without these, FE must continue string-matching English error messages.

### 3. Surface for FE to know which providers are enabled

When external auth is added, FE needs to know:

- which providers are enabled per environment
- provider display name / identifier
- which providers are temporarily unavailable

Without this, FE will hard-code UI and cannot dynamically show/hide social login buttons.

## Suggested backend implementation

### External auth API

A simple approach compatible with popup flow:

1. `GET /api/auth/external/providers`
   - returns enabled providers
   - minimum data:
     - `provider`
     - `displayName`
     - `enabled`

2. `POST /api/auth/external/{provider}/start`
   - validate provider configuration
   - generate challenge/redirect URL for popup
   - optionally persist `state` and anti-forgery data

3. `GET /api/auth/external/{provider}/callback`
   - handle provider callback
   - resolve existing user by email/provider key
   - create new account if policy allows
   - issue the same `AuthResponseDto` contract as normal login
   - return a safe popup bridge page to post result to `window.opener`

### Account resolution policy

Must be defined clearly before implementation:

- if provider returns an email that already exists:
  - link to existing account or reject?
- if provider does not return email:
  - block login or create account in pending state?
- allow one account to link multiple providers?
- require provider email to be verified?

Without clear policy, FE/BE implementations will diverge and become hard to test.

### Error contract

To avoid FE parsing message text, extend `ApiErrorResponse.code` for key login states.

Likely areas to modify:

- `examxy.Infrastructure/Identity/Services/AuthService.cs`
- `examxy.Infrastructure/Identity/Services/IdentityExceptionFactory.cs`
- custom `AppException` if needed
- documentation at `docs/features/authentication.md`

## What BE does NOT need to change

- `Remember me` remains client-only persistence for now unless section `0` is implemented
- login page hero/logo images are FE concerns
- current Google/Facebook popup copy is FE-only placeholder

## Tests to add when BE starts implementation

- integration test for `GET /api/auth/external/providers`
- integration test for disabled/misconfigured provider
- integration test for successful external callback returning `AuthResponseDto`
- integration test for failed external callback returning machine-readable error code
- integration test for account linking / duplicate email policy
- manual verification of popup flow from FE in dev environment

## Related documents

- `docs/features/client-authentication.md`
- `docs/features/authentication.md`
- `docs/features/authentication-test-checklist.md`
