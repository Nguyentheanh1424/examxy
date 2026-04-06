# Auth Email SMTP And Token Debugging

## Context

Them email sender that su cho auth flow, noi vao `register`, `forgot-password`, `resend-email-confirmation`, va test E2E voi Brevo SMTP tren moi truong Development.

## Symptom

- `POST /api/auth/register` tra `500 Internal Server Error`
- log backend co `MailKit.Security.AuthenticationException: 535: 5.7.8 Authentication failed`
- SMTP gui thanh cong nhung user khong thay mail trong inbox
- `confirm-email` va `reset-password` tra `400 Invalid token` khi thu generate token tu process khac
- sau khi doi format text email, integration test `confirm-email` va `reset-password` bat dau fail `500`

## Root cause

- Brevo SMTP credential ban dau khong dung loai credential ma relay yeu cau
  - `Username`/`Password` can dung SMTP login + SMTP key hop le
  - `FromEmail` cung nen la sender da verify
- Mail da duoc gui nhung deliverability chua toi uu nen co the vao `Spam`
- Token confirm/reset cua ASP.NET Identity phu thuoc Data Protection key ring va app context cua process phat hanh token
  - token generate o process phu khong dung chéo voi token ma API process se validate
- Parser test lay URL tu `TextBody` theo cach split chuoi don gian theo dau cach
  - khi text template duoc chuan hoa va co xuong dong ro hon, parser lay sai URL/token

## Fix

- Cap nhat lai SMTP config trong `appsettings.Development.json`/env vars voi Brevo credential hop le
- Xac nhan SMTP bang flow that:
  - `register` gui confirmation email
  - `forgot-password` gui reset email
- Test E2E `confirm-email` va `reset-password` bang chinh link that trong email nhan duoc, khong dung token sinh ngoai process API
- Chuan hoa template mail qua `examxy.Infrastructure/Email/AuthEmailTemplateFactory.cs`
- Sua parser integration test de tim URL bang pattern thay vi split theo dau cach

## Verify

- `dotnet test .\\test.Integration\\test.Integration.csproj`
- Chay backend o Development va goi:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/confirm-email`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
- Kiem tra inbox, `Spam`, va `Promotions`

## Prevention

- Khong commit SMTP credential that vao repo; uu tien env vars hoac secret manager
- Neu gap `535 Authentication failed`, kiem tra truoc:
  - `Email:Username`
  - `Email:Password`
  - sender da verify tren provider chua
  - provider co dung SMTP relay host/port khong
- Neu mail khong thay trong inbox nhung API tra `200`/`204`, kiem tra them `Spam` va deliverability truoc khi nghi backend hong
- Neu test token email bang process phu, dung ky vong se fail neu khong dung chung Data Protection context
- Khi doi template mail, giu parser test doc URL theo regex/pattern thay vi format text mong manh
- Neu thay mail vao spam lien tuc, uu tien cai thien SPF/DKIM/DMARC va sender domain reputation

## Kiem tra dau tien neu gap lai

- file `examxy.Server/appsettings.Development.json`
- file `examxy.Infrastructure/Email/SmtpEmailSender.cs`
- file `examxy.Infrastructure/Email/AuthEmailTemplateFactory.cs`
- file `examxy.Infrastructure/Identity/Services/AuthService.cs`
- file `examxy.Infrastructure/Identity/Services/AccountService .cs`
- file `test.Integration/Auth/AuthApiTests.cs`
- log backend khi goi `register` hoac `forgot-password`
