# API Flow - Classrooms Foundation

## Scope

This flow covers the classroom foundation:

- teacher class CRUD
- roster import + add one student
- invite resend/cancel/claim
- student dashboard hydration

Class content and assessments have separate flow documents:

- `api-flow-class-content.md`
- `api-flow-assessment.md`

## Teacher create class -> open detail

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Classes as Classes API

    Client->>Classes: GET /api/classes
    Classes-->>Client: 200 TeacherClassSummaryDto[]
    Client->>Classes: POST /api/classes
    Classes-->>Client: 200 TeacherClassSummaryDto
    Client->>Classes: GET /api/classes/{classId}
    Classes-->>Client: 200 TeacherClassDetailDto
```

## Teacher roster import

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Classes as Classes API
    participant Import as Teacher Roster Import Service
    participant Email as Email Sender

    Client->>Classes: POST /api/classes/{classId}/roster-imports (multipart file)
    Classes->>Import: parse rows + process
    alt new student email
        Import->>Import: create student account/profile + invite
        Import->>Email: send activation + invite email
    else existing student email
        Import->>Import: create invite only
        Import->>Email: send invite email
    else existing non-student email
        Import->>Import: reject row
    end
    Classes-->>Client: 200 StudentImportBatchDto
```

## Student dashboard -> claim invite

```mermaid
sequenceDiagram
    participant Client as Frontend Client
    participant Dashboard as Student Dashboard API
    participant Invites as Student Invites API
    participant Service as Student Invitation Service

    Client->>Dashboard: GET /api/student/dashboard
    Dashboard-->>Client: 200 StudentDashboardDto
    Client->>Invites: POST /api/student/invites/claim
    Invites->>Service: validate code, expiry, email, usage
    Service->>Service: create Active membership
    Invites-->>Client: 200 ClaimClassInviteResultDto
```

## Endpoints

- `GET /api/classes`
- `POST /api/classes`
- `GET /api/classes/{classId}`
- `PUT /api/classes/{classId}`
- `DELETE /api/classes/{classId}`
- `POST /api/classes/{classId}/roster-imports`
- `POST /api/classes/{classId}/students`
- `DELETE /api/classes/{classId}/memberships/{membershipId}`
- `POST /api/classes/{classId}/invites/{inviteId}/resend`
- `POST /api/classes/{classId}/invites/{inviteId}/cancel`
- `GET /api/student/dashboard`
- `POST /api/student/invites/claim`

## Failure Points

- Teacher accessing another teacher’s class -> `404`
- Deleting a membership not owned by the class owner -> `404`
- Resend/cancel invite when status is `Used` or `Cancelled` -> `409`
- Roster import file has invalid format -> `400`
- Invite claim invalid/expired/used/email mismatch -> `409` or `403`
- Policy role mismatch -> `403`
