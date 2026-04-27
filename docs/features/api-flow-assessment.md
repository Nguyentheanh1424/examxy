# API Flow - Assessment

## Teacher Create -> Publish

```mermaid
sequenceDiagram
    participant FE as Frontend (Teacher)
    participant API as Class Assessments API
    participant SVC as ClassAssessmentService
    participant QBank as Question Bank
    participant DB as Database

    FE->>API: POST /api/classes/{classId}/assessments
    API->>SVC: CreateAssessment(...)
    alt item references question bank
        SVC->>QBank: load source question/version
        SVC->>SVC: snapshot into ClassAssessmentItem
    else inline item
        SVC->>SVC: use DTO snapshot fields
    end
    SVC->>DB: insert ClassAssessments + ClassAssessmentItems
    API-->>FE: AssessmentDto (Draft)

    FE->>API: POST /api/classes/{classId}/assessments/{assessmentId}/publish
    API->>SVC: PublishAssessment(...)
    SVC->>DB: set status to Published + schedule/visibility
    SVC->>DB: create AssessmentPublished user notifications (idempotent key)
    API-->>FE: AssessmentDto (Published)
```

## Student Attempt -> Submit -> Auto-grade

```mermaid
sequenceDiagram
    participant FE as Frontend (Student)
    participant API as Class Assessments API
    participant SVC as ClassAssessmentService
    participant DB as Database

    FE->>API: POST /api/classes/{classId}/assessments/{assessmentId}/attempts
    API->>SVC: StartAttempt(...)
    SVC->>DB: validate membership + availability + attempt limit
    SVC->>DB: insert StudentAssessmentAttempt (InProgress)
    API-->>FE: StudentAssessmentAttemptDto

    FE->>API: PUT /api/classes/{classId}/assessments/attempts/{attemptId}/answers
    API->>SVC: SaveAnswers(...)
    SVC->>DB: upsert StudentAssessmentAnswer rows
    API-->>FE: StudentAssessmentAttemptDto (InProgress)

    FE->>API: POST /api/classes/{classId}/assessments/attempts/{attemptId}/submit
    API->>SVC: SubmitAttempt(...)
    SVC->>SVC: auto-grade objective answers based on snapshot answer key
    SVC->>DB: update answer grading + attempt score/status AutoGraded
    API-->>FE: StudentAssessmentAttemptDto (AutoGraded)
```

## Teacher Paper Exam Template -> Binding -> Review

```mermaid
sequenceDiagram
    participant FE as Frontend (Teacher)
    participant TAPI as Paper Exam Template API
    participant OAPI as Offline Assessment Submissions API
    participant PSVC as PaperExamTemplateService
    participant SSVC as OfflineAssessmentScanService
    participant DB as Database
    participant Storage as Paper Exam Storage

    FE->>TAPI: POST /api/paper-exam/templates/{templateId}/versions/{versionId}/clone
    TAPI->>PSVC: CloneTemplateVersion(...)
    PSVC->>Storage: copy template binary asset when present
    PSVC->>DB: insert new draft version + cloned assets/metadata
    TAPI-->>FE: PaperExamTemplateVersionDto (Draft)

    FE->>OAPI: POST /api/classes/{classId}/assessments/{assessmentId}/paper-binding
    OAPI->>PSVC: UpsertAssessmentBinding(...)
    PSVC->>DB: save Draft or Active binding
    OAPI-->>FE: AssessmentPaperBindingDto

    FE->>OAPI: POST /api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}/review
    OAPI->>SSVC: ReviewSubmission(...)
    SSVC->>DB: replace scan answers, persist teacher audit fields, sync attempt score/status
    OAPI-->>FE: AssessmentScanSubmissionDto

    FE->>OAPI: GET /api/classes/{classId}/assessments/{assessmentId}/offline-submissions/{submissionId}/artifacts/{artifactId}
    OAPI->>SSVC: GetArtifact(...)
    SSVC->>Storage: open artifact stream after teacher-owner authorization
    OAPI-->>FE: file stream
```

## Key Rules

- Assessment content is editable only while in `Draft` status.
- After publishing:
  - Content/items are locked.
  - Only schedule/visibility can be updated via the publish endpoint.

- Attempt limits are enforced before creating a new attempt.
- Timed attempts are enforced on both answer save and submit from the saved `StartedAtUtc` plus `TimeLimitMinutesSnapshot`; expired attempts return `assessment_attempt_expired`.
- Objective questions are auto-graded; non-objective questions require manual grading (backlog).
- Teacher paper-binding reads return the current binding for the teacher owner, including `Draft`.
- Published paper template versions are immutable; edits continue through clone-to-draft.
- Paper submission review persists `TeacherNote`, `ReviewedByTeacherUserId`, `ReviewedAtUtc`, and can finalize in the same review request.
- Paper scanner submission rejects malformed JSON, duplicate/out-of-range question numbers, required metadata gaps, binding version mismatch, config hash mismatch, and schema mismatch before creating submission rows.
