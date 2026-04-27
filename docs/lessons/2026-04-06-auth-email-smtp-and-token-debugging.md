# Auth Email SMTP and Token Debugging

## Context

Added a real email sender for auth flows, integrated into `register`, `forgot-password`, `resend-email-confirmation`, and tested E2E using Brevo SMTP in the Development environment.

## Symptom

- `POST /api/auth/register` returns `500 Internal Server Error`
- backend logs show `MailKit.Security.AuthenticationException: 535: 5.7.8 Authentication failed`
- SMTP reports successful send but users do not see emails in inbox
- `confirm-email` and `reset-password` return `400 Invalid token` when tokens are generated from a different process
- after changing email text format, integration tests for `confirm-email` and `reset-password` start failing with `500`

## Root cause

- Initial Brevo SMTP credentials were not the correct type required by the relay
  - `Username`/`Password` must use valid SMTP login + SMTP key
  - `FromEmail` should also be a verified sender
- Emails were sent but deliverability was not optimized, so they may land in `Spam`
- ASP.NET Identity confirm/reset tokens depend on the Data Protection key ring and app context of the issuing process
  - tokens generated from another process are not valid in the API process
- Test parser extracted URLs from `TextBody` using simple whitespace splitting
  - after email template normalization (with clearer line breaks), parser extracted incorrect URLs/tokens

## Fix

- Updated SMTP configuration in `appsettings.Development.json` / environment variables with valid Brevo credentials
- Verified SMTP using real flows:
  - `register` sends confirmation email
  - `forgot-password` sends reset email
- Performed E2E testing of `confirm-email` and `reset-password` using actual links from received emails, not tokens generated outside the API process
- Standardized email templates via `examxy.Infrastructure/Email/AuthEmailTemplateFactory.cs`
- Updated integration test parser to extract URLs using patterns instead of whitespace splitting

## Verify

- `dotnet test .\\test.Integration\\test.Integration.csproj`
- Run backend in Development and call:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/confirm-email`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- Check inbox, `Spam`, and `Promotions`

## Prevention

- Do not commit real SMTP credentials to the repository; use environment variables or a secret manager
- If encountering `535 Authentication failed`, check:
  - `Email:Username`
  - `Email:Password`
  - whether sender is verified with the provider
  - whether the correct SMTP relay host/port is used
- If email is not visible in inbox but API returns `200`/`204`, check `Spam` and deliverability before assuming backend failure
- When testing email tokens from another process, expect failure unless sharing the same Data Protection context
- When updating email templates, ensure test parsers extract URLs using regex/patterns instead of fragile text formats
- If emails consistently land in spam, prioritize improving SPF/DKIM/DMARC and sender domain reputation

## First things to check when this happens again

- file `examxy.Server/appsettings.Development.json`
- file `examxy.Infrastructure/Email/SmtpEmailSender.cs`
- file `examxy.Infrastructure/Email/AuthEmailTemplateFactory.cs`
- file `examxy.Infrastructure/Identity/Services/AuthService.cs`
- file `examxy.Infrastructure/Identity/Services/AccountService.cs`
- file `test.Integration/Auth/AuthApiTests.cs`
- backend logs when calling `register` or `forgot-password`
