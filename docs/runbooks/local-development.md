# Local Development

## Yeu cau

- .NET SDK phu hop voi `net10.0`
- Node.js cho `examxy.client`
- PostgreSQL local

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
