# Migration Script Lessons

## Context

Trong qua trinh kiem tra migration scripts va wiring auth/backend, da gap mot cum loi lien quan startup project, EF tooling, va cach chay script.

## Symptom

- `dotnet ef` khong chay duoc du script nhin co ve dung
- Script thong bao thanh cong du command that bai
- `migrate-reset-dev` co nguy co drop nham database neu env/config sai
- Chay nhieu lenh `dotnet ef` song song gay loi copy BuildHost files

## Root cause

- Script dang tro toi startup project cu, khong phai `examxy.Server`
- Startup project chua co `Microsoft.EntityFrameworkCore.Design`
- Script PowerShell khong check `$LASTEXITCODE` sau khi goi `dotnet ef`
- Luong reset dev khong ep `Development` va khong check connection string local
- Chay song song nhieu lenh EF Tools tao tranh chap trong thu muc build host

## Fix

- Doi startup project cua scripts sang `examxy.Server`
- Them EF design package vao startup project
- Them ham check exit code de script fail dung luc
- Them guard cho `migrate-reset-dev` de chi dung config development va localhost
- Chay `dotnet ef` theo thu tu khi verify thay vi song song

## Verify

- `dotnet build .\examxy.Server\examxy.Server.csproj`
- `.\scripts\migrate-list.ps1`
- `.\scripts\migrate-update.ps1`
- `.\scripts\migrate-reset-dev.ps1`
- Tao migration tam roi remove lai de smoke test `add/remove`

## Prevention

- Neu thay doi host runtime, cap nhat ngay scripts va runbook migrate
- Khong tin log "success" cua script neu command native chua duoc check exit code
- Khi debug migration, uu tien chay tung lenh EF theo thu tu
- Tranh reset database neu chua xac nhan env va host local

## Kiem tra dau tien neu gap lai

- `scripts/*.ps1`
- `examxy.Server/examxy.Server.csproj`
- `examxy.Server/appsettings.Development.json`
- `examxy.Server/Program.cs`
- `examxy.Infrastructure/Persistence/AppDbContext.cs`
