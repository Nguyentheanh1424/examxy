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
    SVC->>DB: insert idempotent ClassNotifications by NotificationKey
    API-->>FE: ClassPostDto

    FE->>API: POST /api/classes/{classId}/posts/{postId}/comments
    API->>SVC: CreateComment(...)
    SVC->>DB: insert ClassComments
    SVC->>DB: sync comment mentions
    SVC->>DB: insert mention notifications (idempotent)
    API-->>FE: ClassCommentDto
```

## Reaction Flow

```mermaid
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
        SVC->>DB: upsert reaction (1 row/user/target)
    end
    SVC->>DB: aggregate reaction counts
    API-->>FE: ClassReactionSummaryDto
```

## Schedule Flow

```mermaid
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

- teacher owner: full read/write
- student active member: read feed/dashboard/schedule + comment/react
- non-member: forbidden/not found
- draft/unpublished posts khong visible cho student

## Idempotency

- notification rows unique by `NotificationKey`
- update/retry cung context khong tao duplicate notification
