# Test Data Catalog

## Purpose

- Central catalog for local/dev datasets used for manual testing and integration flows
- V1 focuses on class dashboard/content: pre-seeded 1 teacher + 30 students in a class
- Does not bypass JWT/role auth. “No need to authenticate during testing” is handled via seeded accounts with `EmailConfirmed = true`

## Security Notes

- Passwords in this catalog are for local/dev/testing only
- Never use these accounts/passwords in real environments

## Dataset: class-dashboard-v1

- Seed endpoint: `POST /internal/test-data/class-dashboard-v1-seed`
- Secret header: `X-Examxy-Internal-Test-Data-Secret`
- Purpose: test class dashboard/content by role (Teacher/Student) with pre-seeded roster
- Default password for all accounts in this dataset: `Pass123`

### Fixed Test Class

- Name: `Class Dashboard V1`
- Code: `CLASSDASHV1`
- Timezone: `Asia/Ho_Chi_Minh`

### Fixed Account List

| Role    | Full Name                     | Username                    | Email                                    | Local Password |
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

### Manual Seed Command

```powershell
.\scripts\seed-test-class-dashboard.ps1 `
  -ApiBaseUrl "https://localhost:7068" `
  -SharedSecret "dev-only-internal-test-data-secret" `
  -StudentCount 30 `
  -DatasetKey "class-dashboard-v1"
```

- Script is idempotent: re-running does not create duplicate class/membership
- Script does not perform data deletion

## Catalog Extension Convention

- When adding new test data (posts/comments/schedule/assessments), document it in this file under a dataset key
- Each dataset must define:
  - testing purpose
  - seed endpoint/script
  - account list and local/dev credentials
  - domain data created (class, post, comment, schedule, assessment, etc.)
  - cleanup notes if applicable

## Operational Notes

- If endpoint returns `403`, verify the secret header `X-Examxy-Internal-Test-Data-Secret`
- Endpoint only works in `Development`/`Testing`; other environments will reject it
- For stress testing with more students, override `-StudentCount`; default catalog profile remains 30 students
