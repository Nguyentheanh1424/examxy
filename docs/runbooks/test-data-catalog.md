# Test Data Catalog

## Muc tieu

- Catalog trung tam cho cac dataset local/dev dung de test manual va integration flow.
- V1 tap trung cho class dashboard/content: seed san 1 teacher + 30 student trong 1 lop.
- Khong bypass JWT/role auth. Cach "khong can xac thuc tai khoan khi test" duoc xu ly bang account seed co `EmailConfirmed=true`.

## Luu y bao mat

- Mat khau trong catalog nay chi dung cho local/dev/testing.
- Tuyet doi khong dung cac tai khoan/mat khau nay cho moi truong that.

## Dataset: class-dashboard-v1

- Seed endpoint: `POST /internal/test-data/class-dashboard-v1-seed`
- Secret header: `X-Examxy-Internal-Test-Data-Secret`
- Muc dich: test class dashboard/content theo role Teacher/Student voi roster co san.
- Mat khau mac dinh cho toan bo account trong dataset: `Pass123`

### Lop test co dinh

- Name: `Class Dashboard V1`
- Code: `CLASSDASHV1`
- Timezone: `Asia/Ho_Chi_Minh`

### Danh sach tai khoan co dinh

| Vai tro | Ho ten                        | Username                    | Email                                    | Mat khau local |
| ------- | ----------------------------- | --------------------------- | ---------------------------------------- | -------------- |
| Teacher | Teacher Class Dashboard V1    | teacher.classdashboard.v1   | teacher.classdashboard.v1@examxy.local   | Pass123        |
| Student | Student 01 Class Dashboard V1 | student01.classdashboard.v1 | student01.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 02 Class Dashboard V1 | student02.classdashboard.v1 | student02.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 03 Class Dashboard V1 | student03.classdashboard.v1 | student03.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 04 Class Dashboard V1 | student04.classdashboard.v1 | student04.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 05 Class Dashboard V1 | student05.classdashboard.v1 | student05.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 06 Class Dashboard V1 | student06.classdashboard.v1 | student06.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 07 Class Dashboard V1 | student07.classdashboard.v1 | student07.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 08 Class Dashboard V1 | student08.classdashboard.v1 | student08.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 09 Class Dashboard V1 | student09.classdashboard.v1 | student09.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 10 Class Dashboard V1 | student10.classdashboard.v1 | student10.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 11 Class Dashboard V1 | student11.classdashboard.v1 | student11.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 12 Class Dashboard V1 | student12.classdashboard.v1 | student12.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 13 Class Dashboard V1 | student13.classdashboard.v1 | student13.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 14 Class Dashboard V1 | student14.classdashboard.v1 | student14.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 15 Class Dashboard V1 | student15.classdashboard.v1 | student15.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 16 Class Dashboard V1 | student16.classdashboard.v1 | student16.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 17 Class Dashboard V1 | student17.classdashboard.v1 | student17.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 18 Class Dashboard V1 | student18.classdashboard.v1 | student18.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 19 Class Dashboard V1 | student19.classdashboard.v1 | student19.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 20 Class Dashboard V1 | student20.classdashboard.v1 | student20.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 21 Class Dashboard V1 | student21.classdashboard.v1 | student21.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 22 Class Dashboard V1 | student22.classdashboard.v1 | student22.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 23 Class Dashboard V1 | student23.classdashboard.v1 | student23.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 24 Class Dashboard V1 | student24.classdashboard.v1 | student24.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 25 Class Dashboard V1 | student25.classdashboard.v1 | student25.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 26 Class Dashboard V1 | student26.classdashboard.v1 | student26.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 27 Class Dashboard V1 | student27.classdashboard.v1 | student27.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 28 Class Dashboard V1 | student28.classdashboard.v1 | student28.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 29 Class Dashboard V1 | student29.classdashboard.v1 | student29.classdashboard.v1@examxy.local | Pass123        |
| Student | Student 30 Class Dashboard V1 | student30.classdashboard.v1 | student30.classdashboard.v1@examxy.local | Pass123        |

### Cach seed manual

```powershell
.\scripts\seed-test-class-dashboard.ps1 `
  -ApiBaseUrl "https://localhost:7068" `
  -SharedSecret "dev-only-internal-test-data-secret" `
  -StudentCount 30 `
  -DatasetKey "class-dashboard-v1"
```

- Script la idempotent: chay lai khong tao duplicate class/membership.
- Script khong thuc hien thao tac xoa du lieu.

## Quy uoc mo rong catalog ve sau

- Khi bo sung du lieu test moi (posts/comments/schedule/assessments), ghi ro trong file nay theo dataset key.
- Moi dataset moi can khai bao:
  - muc tieu test;
  - endpoint/script seed;
  - danh sach account va credentials local/dev;
  - du lieu domain duoc tao (class, post, comment, schedule, assessment, ...);
  - ghi chu cleanup neu co.

## Ghi chu van hanh

- Neu endpoint tra `403`, kiem tra lai secret header `X-Examxy-Internal-Test-Data-Secret`.
- Endpoint chi hoat dong trong `Development`/`Testing`; moi truong khac se bi tu choi.
- Khi can doi so luong student de stress test, co the override `-StudentCount`; catalog mac dinh van theo profile 30 student.
