# Local Development

## Yeu cau

- .NET SDK phu hop voi `net10.0`
- Node.js cho `examxy.client`
- PostgreSQL local
- SMTP credentials neu muon test email flow that su

## Chay backend

```powershell
dotnet build .\examxy.Server\examxy.Server.csproj
dotnet run --project .\examxy.Server\examxy.Server.csproj
```

## Chay frontend

```powershell
cd .\examxy.client
npm install
npm run dev
```

## Build nhanh toan repo

```powershell
dotnet build .\examxy.Server\examxy.Server.csproj
dotnet test
```

## Migrate database

Danh sach script:

- `scripts/migrate-add.ps1`
- `scripts/migrate-list.ps1`
- `scripts/migrate-remove.ps1`
- `scripts/migrate-update.ps1`
- `scripts/migrate-reset-dev.ps1`

Vi du:

```powershell
.\scripts\migrate-list.ps1
.\scripts\migrate-add.ps1 -Name InitIdentity
.\scripts\migrate-update.ps1
```

## Config dev dang duoc dung

- backend host: `examxy.Server`
- connection string dev: `examxy.Server/appsettings.Development.json`
- script `migrate-reset-dev.ps1` chi nen dung voi database local development

## Config email va auth moi

Backend hien can day du cac section sau de startup:

- `ConnectionStrings:DefaultConnection`
- `Jwt:*`
- `Email:*`
- `AppUrls:*`

Vi du trong `appsettings.Development.json` hoac env vars:

```json
{
  "Email": {
    "FromEmail": "noreply@yourdomain.com",
    "FromName": "examxy",
    "Host": "smtp-relay.brevo.com",
    "Port": 587,
    "Username": "your-brevo-smtp-login",
    "Password": "your-brevo-smtp-key"
  },
  "AppUrls": {
    "FrontendBaseUrl": "http://localhost:5173",
    "ConfirmEmailPath": "/confirm-email",
    "ResetPasswordPath": "/reset-password"
  }
}
```

## Goi y dung env vars

Khong nen commit SMTP credentials that vao repo. Co the set bang env vars:

```powershell
$env:Email__FromEmail="noreply@yourdomain.com"
$env:Email__FromName="examxy"
$env:Email__Host="smtp-relay.brevo.com"
$env:Email__Port="587"
$env:Email__Username="your-brevo-smtp-login"
$env:Email__Password="your-brevo-smtp-key"
$env:AppUrls__FrontendBaseUrl="http://localhost:5173"
$env:AppUrls__ConfirmEmailPath="/confirm-email"
$env:AppUrls__ResetPasswordPath="/reset-password"
```

## Luu y behavior auth hien tai

- `register` se gui email confirmation ngay sau khi tao user.
- `login` se tra `403` neu email chua duoc confirm.
- `forgot-password` chi gui email cho user ton tai va da confirm email.
- `resend-email-confirmation` chi gui email cho user ton tai va chua confirm.
- `reset-password` va `confirm-email` dung token da duoc URL-safe encode trong link frontend.

## Luu y khi test email that

- Subject hien tai:
  - `Examxy: Confirm your email address`
  - `Examxy: Reset your password`
- Mail co ca HTML button va plain-text fallback, nen co the test bang webmail hoac mobile mail client.
- Neu khong thay mail trong inbox, can kiem tra them `Spam` va `Promotions`.
- Voi sender moi hoac domain chua toi uu SPF/DKIM/DMARC, mail transactional co the vao spam du SMTP gui thanh cong.
- Khi test local, nen dung email alias (`name+tag@example.com`) de phan biet tung lan gui.
