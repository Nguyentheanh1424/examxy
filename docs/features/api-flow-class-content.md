# API Flow - Class Content

## Post + Comment + Mention + Notification

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Class Content API
    participant SVC as ClassContentService
    participant DB as Database

    FE->>API: POST /api/classes/{classId}/posts
    API->>SVC: CreatePost(userId, classId, dto)
    SVC->>DB: insert ClassPosts + attachments
    SVC->>DB: sync mention rows (tagged users / notifyAll)
    SVC->>DB: insert idempotent UserNotifications by NotificationKey
    API-->>FE: ClassPostDto

    FE->>API: POST /api/classes/{classId}/posts/{postId}/comments
    API->>SVC: CreateComment(...)
    SVC->>DB: insert ClassComments
    SVC->>DB: sync comment mentions
    SVC->>DB: insert mention notifications (idempotent)
    API-->>FE: ClassCommentDto
```

````

## Reaction Flow

```mermaid id="p1x7qm"
sequenceDiagram
    participant FE as Frontend
    participant API as Class Content API
    participant SVC as ClassContentService
    participant DB as Database

    FE->>API: PUT /api/classes/{classId}/posts/{postId}/reaction
    API->>SVC: SetPostReaction(...)
    alt reactionType null/empty
        SVC->>DB: delete current reaction row
    else reactionType provided
        SVC->>DB: upsert reaction (1 row per user per target)
    end
    SVC->>DB: aggregate reaction counts
    API-->>FE: ClassReactionSummaryDto
```

## Schedule Flow

```mermaid id="8x0n1r"
sequenceDiagram
    participant FE as Frontend
    participant API as Class Content API
    participant SVC as ClassContentService
    participant DB as Database

    FE->>API: GET /api/classes/{classId}/schedule-items
    API->>SVC: GetScheduleItems(...)
    SVC->>DB: query ClassScheduleItems
    API-->>FE: ClassScheduleItemDto[]

    FE->>API: POST /api/classes/{classId}/schedule-items (teacher)
    API->>SVC: CreateScheduleItem(...)
    SVC->>DB: insert ClassScheduleItems
    API-->>FE: ClassScheduleItemDto
```

## Access Checks

- Teacher (owner): full read/write access
- Student (active member): can read feed/dashboard/schedule + comment/react
- Non-member: forbidden or not found
- Draft/unpublished posts are not visible to students

## Mention Candidates

- `GET /api/classes/{classId}/mention-candidates`
- Authorization is the same as feed/dashboard:
  - Teacher (owner): allowed to retrieve list
  - Student (active member): allowed to retrieve list
  - Non-member: `403`

- Response includes class participants (excluding the current actor):
  - `userId`
  - `displayName`
  - `email`

## Idempotency

- Notification rows are unique by `NotificationKey`
- Repeated updates/retries with the same context do not create duplicate notifications
- The canonical notification inbox API is located at `/api/notifications`
````
