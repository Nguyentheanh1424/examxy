# Current State

## Muc tieu gan day

- Dung nen auth/identity tren backend
- Co kha nang migrate PostgreSQL qua EF Core scripts
- Giu repo de AI co the vao task nhanh hon
- Thong nhat API error handling cho backend

## Trang thai hien tai

- Backend build duoc voi `examxy.Server`.
- Frontend da la auth client thuc su voi route/login/register/account/confirm/reset password, docs rieng, va test frontend co ban.
- Auth/identity da co controller, services, token service, seeding, va `AppDbContext`.
- Backend da co `AppException` hierarchy, model validation filter, global exception middleware, va response JSON loi thong nhat.
- Migration scripts da co, nhung can theo doi xem co migration business thuc te nao da duoc tao chua.

## Diem can nho cho nhung turn sau

- Khi sua auth, kiem tra ca DTO, interface Application, wiring Infrastructure, filter, middleware, va controller.
- Khi sua API error behavior, uu tien check `examxy.Application/Exceptions`, `IdentityExceptionFactory`, `ValidateModelStateFilter`, va `GlobalExceptionHandlingMiddleware`.
- Khi sua database, kiem tra `scripts/` va `appsettings.Development.json`.
- Khi sua startup, uu tien `examxy.Server.csproj` thay vi cac file API cu neu co.
- Khi them feature lon, nen bo sung mot file trong `docs/features/`.
- Khi vua fix xong mot loi mat nhieu thoi gian, ghi lai trong `docs/lessons/`.

## No ky thuat dang de y

- Repo co dau vet placeholder file cu trong mot so thu muc.
- Frontend auth da co docs rieng trong `docs/features/client-authentication.md`.
- Chua co ADRs duoc ghi lai; khi co quyet dinh lon nen bat dau ghi trong `docs/decisions/`.
- Startup/config errors va seeding errors van la runtime errors cua host, khong nam trong API exception contract cua request pipeline.
