# examxy

Monorepo nho gom backend .NET, frontend React/Vite, va cac test projects.

## Repo map nhanh

- Backend host: `examxy.Server`
- Application contracts va shared exceptions: `examxy.Application`
- Domain core: `examxy.Domain`
- Infrastructure, Identity, JWT, persistence: `examxy.Infrastructure`
- Frontend React/Vite: `examxy.client`
- Test projects: `test.Application`, `test.Domain`, `test.Integration`

## Doc nen doc truoc

- `docs/README.md`
- `docs/architecture/solution-map.md`
- `docs/context/current-state.md`
- `docs/features/authentication.md`
- `docs/features/error-handling.md`

## Verify nhanh

```powershell
dotnet build .\examxy.Server\examxy.Server.csproj
dotnet test .\examxy.slnx
```

## Ghi chu

- Startup project backend dang duoc dung la `examxy.Server.csproj`.
- API errors hien tai da duoc thong nhat qua `AppException`, model validation filter, va global exception middleware.
