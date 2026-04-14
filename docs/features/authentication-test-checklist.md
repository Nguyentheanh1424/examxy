# Authentication API Test Checklist

## Trang thai hien tai

- Test file: `test.Integration/Auth/AuthApiTests.cs`
- Test file: `test.Integration/Auth/ClassroomApiTests.cs`
- Test file: `test.Integration/Auth/InternalAdminApiTests.cs`
- Test file: `test.Integration/Auth/IdentityRoleMigrationTests.cs`
- Config guard tests: `test.Integration/Auth/InfrastructureConfigurationTests.cs`
- Test host: `WebApplicationFactory<Program>` + SQLite test database + in-memory `IEmailSender`
- Auth email templates duoc assert o muc subject + text body link/token
- Test assembly da tat parallelization de tranh xung dot env/config trong test host
- Lenh verify:

```powershell
dotnet test .\test.Integration\test.Integration.csproj
dotnet test .\examxy.slnx
```

## API da duoc test

- [x] `POST /api/auth/register`
  - success case tra token va `primaryRole = Teacher`
  - tao user unconfirmed
  - tao `TeacherProfile`
  - gui confirmation email qua fake sender voi subject/body da chuan hoa
  - validation error tra `400`
  - duplicate username tra `409`
  - duplicate email tra `409`
- [x] `POST /api/auth/register/student`
  - success case tra token va `primaryRole = Student`
  - tao `StudentProfile`
  - student moi vao duoc dashboard rong
- [x] `POST /api/auth/login`
  - user chua confirm email tra `403`
  - invalid password tra `401`
  - user da confirm login thanh cong
  - auth response tra `primaryRole`
  - lockout sau nhieu lan sai tra `403`
- [x] `POST /api/auth/refresh-token`
  - token pair hop le tra token moi
- [x] `POST /api/auth/logout`
  - khong co access token tra `401`
  - revoke refresh token va khien refresh cu tra `401`
  - refresh token khong thuoc authenticated user tra `403`
- [x] `GET /api/auth/me`
  - bearer token hop le tra current user
  - tra `primaryRole`
- [x] `POST /api/auth/change-password`
  - doi mat khau thanh cong
  - mat khau cu khong dang nhap lai duoc
  - refresh token cu bi revoke
- [x] `POST /api/auth/forgot-password`
  - email khong ton tai van tra `204`
  - email chua confirm tra `204` va khong gui email
  - email da confirm tra `204` va gui reset email voi subject/body da chuan hoa
- [x] `POST /api/auth/reset-password`
  - token URL-safe lay tu email reset reset duoc mat khau
- [x] `POST /api/auth/confirm-email`
  - token URL-safe lay tu email confirmation confirm duoc email
- [x] `POST /api/auth/resend-email-confirmation`
  - user chua confirm tra `204` va gui email voi subject/body da chuan hoa
  - user da confirm tra `204` va khong gui email
- [x] `GET /api/classes`
  - teacher lay duoc danh sach class cua minh
- [x] `POST /api/classes`
  - teacher tao class thanh cong
- [x] `GET /api/classes/{classId}`
  - teacher xem duoc class cua minh
  - teacher khong xem duoc class cua teacher khac
- [x] `POST /api/classes/{classId}/roster-imports`
  - imported new email tao invited student account + invite + mail dispatch
  - imported existing student chi tao invite moi
  - imported existing teacher/admin bi reject dung row
- [x] `GET /api/student/dashboard`
  - student moi chua co class van lay duoc dashboard rong
- [x] `POST /api/student/invites/claim`
  - invite chi dung mot lan
  - invite chi claim duoc boi account co dung email
  - claim thanh cong tao membership `Active`
- [x] `POST /internal/admin-users`
  - thieu secret header bi tu choi
  - secret dung tao account admin thanh cong

## Migration va seed da duoc test

- [x] role legacy `User` duoc backfill sang `Teacher`
- [x] role moi duoc seed dung: `Teacher`, `Student`, `Admin`
- [x] teacher/student profile duoc tao dong bo voi user khi can

## E2E thu cong da duoc xac nhan

- [x] SMTP Brevo gui confirmation email that su tren moi truong Development
- [x] Link confirm trong email dung duoc de confirm account
- [x] SMTP Brevo gui reset email that su tren moi truong Development
- [x] Link reset trong email dung duoc de dat lai mat khau
- [x] Login voi mat khau cu tra `401` sau khi reset
- [x] Login voi mat khau moi tra `200` sau khi reset

## Config/startup da duoc test

- [x] thieu section `Email` se fail startup voi `InvalidOperationException`
- [x] `AppUrls:FrontendBaseUrl` khong hop le se fail startup voi `InvalidOperationException`
- [x] thieu `AppUrls:StudentDashboardPath` se fail startup voi `InvalidOperationException`
- [x] thieu `InternalAdminProvisioning` se fail startup voi `InvalidOperationException`

## Nhung gi can luu y

- Integration tests khong goi SMTP that; thay vao do dung `InMemoryEmailSender` de assert subject, recipient, va link/token trong body.
- Vi mail template hien co xuong dong va text fallback ro rang hon, parser test can tim URL theo pattern thay vi tach chuoi theo dau cach.
- `reset-password` va `confirm-email` gio consume token da encode cho URL, nen test success path phai lay token tu email body thay vi generate raw token truc tiep tu `UserManager`.
- Test host dung config `DatabaseProvider=Sqlite`; neu sau nay doi wiring Infrastructure, can giu cho branch test provider nay van hoat dong.
- `logout` hien da yeu cau ca bearer access token va refresh token; test da khoa lai ca happy path lan owner mismatch path.
- Classroom/import tests co mail side effect; neu doi email template hay onboarding link structure, can cap nhat parser va assertions tuong ung.
- Internal admin API khong public trong swagger, nhung van can integration tests vi no phu thuoc config secret.

## Goi y cai thien tiep theo

- Khi bat dau external auth/OAuth, follow `docs/features/authentication-backend-gaps.md` va bo sung integration tests cho provider list, start, callback, va error code on dinh.
- Can them test cho cac nhanh `404` cua `refresh-token`, `reset-password`, va `confirm-email` de cover du status docs dang mo ta.
- Can them test cho `401` khi goi `GET /api/auth/me` hoac `POST /api/auth/change-password` ma khong co bearer token.
- Can them test cho register failure khi email sender throw exception, de khoa lai behavior rollback user tao moi.
- Can them visual review checklist cho HTML email neu sau nay template phuc tap hon.
- Can them integration tests cho `PUT`/`DELETE` class va invite expired path khi cac flow nay duoc mo rong.

