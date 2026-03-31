# Authentication API Test Checklist

## Trang thai hien tai

- Test file: `test.Integration/Auth/AuthApiTests.cs`
- Test host: `WebApplicationFactory<Program>` + SQLite test database
- Lenh verify:

```powershell
dotnet test .\test.Integration\test.Integration.csproj
dotnet test .\examxy.slnx
```

## API da duoc test

- [x] `POST /api/auth/register`
  - success case tra token va role `User`
  - validation error tra `400`
  - duplicate username tra `409`
  - duplicate email tra `409`
- [x] `POST /api/auth/login`
  - invalid password tra `401`
  - lockout sau nhieu lan sai tra `403`
- [x] `POST /api/auth/refresh-token`
  - token pair hop le tra token moi
- [x] `POST /api/auth/logout`
  - khong co access token tra `401`
  - revoke refresh token va khien refresh cu tra `401`
  - refresh token khong thuoc authenticated user tra `403`
- [x] `GET /api/auth/me`
  - bearer token hop le tra current user
- [x] `POST /api/auth/change-password`
  - doi mat khau thanh cong
  - mat khau cu khong dang nhap lai duoc
  - refresh token cu bi revoke
- [x] `POST /api/auth/forgot-password`
  - email khong ton tai van tra `204`
- [x] `POST /api/auth/reset-password`
  - token hop le reset duoc mat khau
- [x] `POST /api/auth/confirm-email`
  - token hop le confirm duoc email
- [x] `POST /api/auth/resend-email-confirmation`
  - request hop le tra `204`

## Nhung gi can luu y

- `forgot-password` va `resend-email-confirmation` hien moi cover o muc HTTP contract vi email sender chua duoc implement.
- `reset-password` va `confirm-email` success path trong test dang generate token truc tiep tu `UserManager`; day la hop ly o muc integration backend, nhung chua phai end-to-end email flow.
- Test host dung config `DatabaseProvider=Sqlite`; neu sau nay doi wiring Infrastructure, can giu cho branch test provider nay van hoat dong.
- `logout` hien da yeu cau ca bearer access token va refresh token; test da khoa lai ca happy path lan owner mismatch path.

## Goi y cai thien tiep theo

- Can them test cho cac nhanh `404` cua `refresh-token`, `reset-password`, va `confirm-email` de cover du status docs dang mo ta.
- Can them test cho `401` khi goi `GET /api/auth/me` hoac `POST /api/auth/change-password` ma khong co bearer token.
- `refresh-token` hien tra `404` neu user trong token khong con ton tai; can xac nhan day co phai semantics mong muon hay nen doi ve `401` de giam leak thong tin.
