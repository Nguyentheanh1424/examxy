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
    SVC->>DB: set status Published + schedule/visibility
    SVC->>DB: create AssessmentPublished notifications (idempotent key)
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
    SVC->>SVC: auto-grade objective answers vs snapshot answer key
    SVC->>DB: update answer grading + attempt score/status AutoGraded
    API-->>FE: StudentAssessmentAttemptDto (AutoGraded)
```

## Key Rules

- assessment content editable only while `Draft`.
- sau publish:
  - lock content/items
  - chi schedule/visibility update qua publish endpoint.
- attempt limit enforced before new attempt.
- auto-grade objective types; non-objective backlog manual grading.
