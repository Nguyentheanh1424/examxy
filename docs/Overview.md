**1. Module Overview**

- `Auth & session`: đăng ký, đăng nhập, refresh token, account, đổi mật khẩu, quên mật khẩu, xác nhận email. FE đã có đầy đủ màn auth; routing theo `primaryRole`.
- `Classroom foundation`: teacher tạo lớp, student dashboard, claim invite, import roster. FE đã có nhưng import roster đang có contract drift với BE.
- `Class dashboard content`: class summary, feed, comment, reaction, schedule, mentions, realtime. FE đã có shared screen cho teacher và student.
- `Assessments`: danh sách bài, tạo draft, publish, student attempt, save, submit, results. FE có nhưng UX còn low-fidelity, nhiều chỗ là raw JSON editor.
- `Notifications`: inbox, unread/read, deep link. FE đã có inbox cơ bản; BE hỗ trợ filter sâu hơn FE đang expose.
- `Question bank`: CRUD câu hỏi cho teacher. FE có bản cơ bản; attachment và preview cấu trúc chưa có.
- `Paper exams / offline`: template, version, binding, offline submission/review/finalize. FE mới có template + version; phần lớn flow vẫn chỉ có ở BE/docs.
- `Admin / internal admin`: admin dashboard FE hiện là placeholder; internal admin chủ yếu là API có shared-secret.
- `Shared UI / design system`: docs DS khá đầy đủ, nhưng shipped FE mới có subset primitives; token naming trong code và docs đang lệch nhau.

**2. User Personas / Roles**

- `Teacher`: tạo và quản lý lớp, đăng bài, lên lịch, import roster, quản lý question bank, tạo/publish assessment, xem kết quả, dùng notifications.
- `Student`: tự đăng ký, xác nhận email, vào student dashboard, claim invite/join class, xem feed/lịch, comment/react, làm assessment, xem notifications.
- `Admin`: có route `/admin/dashboard`; FE hiện gần như chưa có tooling, nhưng BE cho phép admin vào paper exam templates.
- `Anonymous`: dùng login/register/reset/confirm flows; guest-only routes tự redirect nếu đã có session.
- `Internal admin operator`: chỉ thấy ở API docs/code qua shared-secret header; chưa có FE screen tương ứng.
- Persona chi tiết hơn theo tổ chức, quy mô lớp, hay phân vai phụ chưa thấy trong repo. `Unknown / Need confirmation`.

**3. Screen Inventory**

- `Root Redirect` | Route: `/` | Purpose: điều hướng người dùng tới dashboard đúng role | Main components: route logic, không có screen riêng | Data shown: session `primaryRole` | Actions: redirect sang teacher/student/admin dashboard | API dependencies: session bootstrap từ auth context, `GET /api/auth/me` khi restore | Permissions: mọi user; behavior phụ thuộc session | States: bootstrapping spinner, redirect | Design status: hạ tầng, không phải màn hình business.
- `Login` | Route: `/login` | Purpose: xác thực user | Main components: `AuthEdgeLayout`, form credentials, `TextField`, `CheckboxField`, `Button`, `Notice` | Data shown: `userNameOrEmail`, `password`, `rememberMe`, warning khi cần confirm email | Actions: sign in, đi tới register/forgot/resend-confirmation, mở popup provider placeholder | API dependencies: `POST /api/auth/login` | Permissions: guest-only | States: bootstrapping redirect, idle, submitting, `email_confirmation_required`, success redirect, generic error | Design status: existing FE.
- `Teacher Register` | Route: `/register` | Purpose: tạo teacher account | Main components: `AuthEdgeLayout`, register form | Data shown: `userName`, `email`, `password`, `confirmPassword` | Actions: submit register, đi login | API dependencies: `POST /api/auth/register` | Permissions: guest-only | States: idle, submitting, success redirect/session, validation error, conflict error | Design status: existing FE; note `fullName` có trong DTO nhưng FE không expose.
- `Student Register` | Route: `/student/register` | Purpose: tạo student account | Main components: `AuthEdgeLayout`, register form | Data shown: `fullName`, `userName`, `studentCode`, `email`, `password`, `confirmPassword` | Actions: submit register, đi login | API dependencies: `POST /api/auth/register/student` | Permissions: guest-only | States: idle, submitting, success redirect/session, validation/conflict error | Design status: existing FE.
- `Forgot Password` | Route: `/forgot-password` | Purpose: khởi động password reset privacy-safe | Main components: `AuthEdgeLayout`, email form, success notice | Data shown: `email` | Actions: submit email, quay về login | API dependencies: `POST /api/auth/forgot-password` | Permissions: public | States: idle, submitting, privacy-safe success, validation error | Design status: existing FE.
- `Resend Email Confirmation` | Route: `/resend-email-confirmation` | Purpose: gửi lại email confirm privacy-safe | Main components: `AuthEdgeLayout`, email form, success notice | Data shown: `email` | Actions: submit, quay về login | API dependencies: `POST /api/auth/resend-email-confirmation` | Permissions: public | States: idle, submitting, privacy-safe success, validation error | Design status: existing FE.
- `Confirm Email` | Route: `/confirm-email?userId=...&token=...` | Purpose: hoàn tất xác nhận email từ link | Main components: `AuthEdgeLayout`, auto-submit status panel | Data shown: query params, status copy | Actions: auto confirm, đi login | API dependencies: `POST /api/auth/confirm-email` | Permissions: public | States: `pending`, `success`, `invalid`, `error` | Design status: existing FE.
- `Reset Password` | Route: `/reset-password?email=...&token=...` | Purpose: hoàn tất reset password | Main components: `AuthEdgeLayout`, password form, invalid-link notice | Data shown: `email`, `token`, `password`, `confirmPassword` | Actions: submit reset, đi login | API dependencies: `POST /api/auth/reset-password` | Permissions: public | States: invalid-link, idle, submitting, success, error | Design status: existing FE.
- `Account` | Route: `/account` | Purpose: xem identity snapshot và đổi mật khẩu | Main components: `CardShell`, profile/session summary, password form, notices, sign-out action | Data shown: current user, roles, email confirmation status, session metadata | Actions: change password, sign out | API dependencies: `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/logout` | Permissions: authenticated | States: loading, success, validation error, API error | Design status: existing FE.
- `Not Found` | Route: `*` | Purpose: fallback route | Main components: generic not-found view | Data shown: not found copy | Actions: navigate home | API dependencies: none | Permissions: public | States: static | Design status: existing FE.
- `Teacher Dashboard` | Route: `/teacher/dashboard` | Purpose: landing page cho teacher | Main components: header action rail, class card grid, empty state `CardShell` | Data shown: class summaries gồm code, name, created date, status, active students, pending invites | Actions: open class, open assessments, import students, go notifications, question bank, paper exams, account, create class | API dependencies: `GET /api/classes` | Permissions: teacher-only | States: loading, empty, success, error | Design status: existing FE.
- `Create Teacher Class` | Route: `/teacher/classes/new` | Purpose: tạo lớp mới | Main components: form card | Data shown: `name`, optional `code` | Actions: submit create, cancel/back | API dependencies: `POST /api/classes` | Permissions: teacher-only | States: idle, submitting, success redirect to class, validation/conflict error | Design status: existing FE.
- `Teacher Class Import` | Route: `/teacher/classes/:classId/import` | Purpose: import roster cho lớp | Main components: form card, manual textarea parser, parsed preview, result summary/list | Data shown: `sourceFileName`, `rawRoster`, parsed rows, batch results per row | Actions: parse/import roster, back to dashboard/class | API dependencies: FE calls `POST /api/classes/{classId}/roster-imports` with JSON | Permissions: teacher-only | States: idle, parsing, submitting, success with row results, error | Design status: existing FE but contract drift with BE multipart endpoint.
- `Student Dashboard` | Route: `/student/dashboard` | Purpose: landing page cho student | Main components: join-class form, profile snapshot card, active classes section, pending invites section | Data shown: profile, active classes, pending invites, optional invite code from query string | Actions: claim invite/join class, open class, open assessments, refresh | API dependencies: `GET /api/student/dashboard`, `POST /api/student/invites/claim` | Permissions: student-only | States: loading, empty sections, auto-claim in progress, success, error | Design status: existing FE.
- `Admin Dashboard` | Route: `/admin/dashboard` | Purpose: admin landing | Main components: placeholder card | Data shown: minimal placeholder copy | Actions: none meaningful today | API dependencies: none meaningful | Permissions: admin-only | States: static placeholder | Design status: existing FE but not a real admin workspace.
- `Class Dashboard` | Route: `/classes/:classId` | Purpose: shared class workspace cho teacher/student | Main components: class summary card, teacher composer, feed list, comment threads, reaction chips, mention picker, right-column shortcuts + schedule list/forms | Data shown: class dashboard meta, feed items, comments, reactions, mention candidates, schedule items | Actions: create/update post, add/edit comment, hide comment, react, create/update schedule, open notifications/assessments | API dependencies: `GET /api/classes/{id}/dashboard`, `GET /api/classes/{id}/feed`, `GET /api/classes/{id}/schedule-items`, `GET /api/classes/{id}/mention-candidates`, post/comment/reaction/schedule mutation endpoints, realtime hub | Permissions: teacher and student members; teacher-owner-only for post/schedule moderation actions | States: loading, success, empty feed/schedule, error, role-based action hiding | Design status: existing FE.
- `Class Assessments` | Route: `/classes/:classId/assessments` | Purpose: shared assessments workspace | Main components: summary cards, teacher draft form, assessment cards, publish/results actions, student attempt editor | Data shown: assessments, attempt state, results, optional focused assessment via query param | Actions: teacher create/update/publish/load results; student start attempt, edit answers, save, submit | API dependencies: `GET/POST /api/classes/{id}/assessments`, `PUT /api/classes/{id}/assessments/{assessmentId}`, `POST /api/classes/{id}/assessments/{assessmentId}/publish`, attempt/result endpoints | Permissions: teacher and student members; create/publish/results are teacher-owner actions | States: loading, empty, success, error, in-progress attempt, submitted/closed locked state | Design status: existing FE but low-fidelity and raw-contract oriented.
- `Notifications` | Route: `/notifications` | Purpose: account-level inbox | Main components: filter bar, list items, mark-read controls | Data shown: notification list, unread count, metadata like `featureArea`, `classId`, `assessmentId`, `postId`, `commentId` | Actions: refresh, mark one read, mark all read, open deep link target | API dependencies: `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`, realtime events | Permissions: authenticated | States: loading, empty, success, error | Design status: existing FE; advanced filters supported by BE but not fully surfaced.
- `Question Bank` | Route: `/teacher/question-bank` | Purpose: teacher quản lý bank câu hỏi | Main components: create form, question list/cards, inline edit fields | Data shown: question stem, type, tags, status, current version, raw JSON payloads | Actions: create, update, delete/archive-like removal, inspect question | API dependencies: `GET/POST /api/question-bank/questions`, `GET/PUT/DELETE /api/question-bank/questions/{id}` | Permissions: teacher-only | States: loading, empty, success, error, inline edit | Design status: existing FE but missing attachments and richer preview.
- `Paper Exam Templates` | Route: `/teacher/paper-exams` | Purpose: quản lý template/version cho paper exams | Main components: create template form, per-template create-version form, version list | Data shown: template code/name, version metadata, version list | Actions: create template, create version | API dependencies: `GET/POST /api/paper-exam/templates`, `POST /api/paper-exam/templates/{templateId}/versions` | Permissions: FE route allows teacher/admin; BE also allows teacher/admin | States: loading, empty, success, error | Design status: existing FE nhưng chỉ phủ phần rất nhỏ của backend paper-exam domain.

**4. Primary User Flows**

1. `Teacher auth -> teacher workspace`: register teacher -> confirm email -> login -> root redirect theo `primaryRole` -> teacher dashboard -> create class -> class dashboard.
2. `Student auth -> class join`: register student -> confirm email -> login -> student dashboard -> claim invite hoặc auto-claim từ `?inviteCode=` -> open class -> view feed/assessments.
3. `Teacher class setup`: teacher dashboard -> create class -> import roster -> review import result -> open class -> bắt đầu dùng feed/schedule.
4. `Class communication`: vào `/classes/:classId` -> teacher tạo post hoặc student đọc feed -> comment -> react -> mention -> realtime refresh cho thành viên khác.
5. `Assessment lifecycle`: teacher tạo draft -> chỉnh sửa nội dung -> publish -> student start attempt -> save answers -> submit -> teacher load results.
6. `Question bank -> assessment`: BE hỗ trợ snapshot câu hỏi từ question bank sang assessment; FE hiện chưa có flow UX rõ cho chọn question bank vào assessment. `Unknown / Need confirmation` nếu redesign cần nối 2 module này trên UI.
7. `Notifications loop`: backend tạo notification -> realtime inbox refresh -> user mở `/notifications` -> mark read hoặc open target -> assessment deep link hoạt động tốt hơn feed deep link.
8. `Paper exam offline workflow`: backend hỗ trợ template -> validate/publish version -> bind vào assessment -> lấy offline config -> submit offline -> teacher review/finalize; FE hiện mới có create template/version, còn lại cần thiết kế mới nếu scope có bao gồm.

**5. Key Actions Per Screen**

- `Login`: sign in, navigate to register, forgot password, resend confirmation.
- `Teacher Register`: create teacher account.
- `Student Register`: create student account.
- `Account`: refresh profile snapshot, change password, sign out.
- `Teacher Dashboard`: create class, open class, open assessments, import roster, jump to notifications/question bank/paper exams/account.
- `Student Dashboard`: claim invite, open class, open assessments, refresh dashboard.
- `Class Dashboard`: create/update post, comment, edit own comment, hide comment, react to post/comment, create/update schedule, open notifications/assessments.
- `Class Assessments`: create/update/publish assessment, start attempt, save answers, submit attempt, load results.
- `Notifications`: filter, refresh, mark one read, mark all read, open target route.
- `Question Bank`: create, edit, delete questions.
- `Paper Exam Templates`: create template, create version.
- `Admin Dashboard`: hiện chưa có key action thực tế.

**6. Data Model And UI Fields**
| Entity | Key UI fields | Where surfaced | Notes |
|---|---|---|---|
| `AuthSession` | `userId`, `userName`, `email`, `primaryRole`, `roles`, `accessToken`, `refreshToken`, `expiresAtUtc` | auth context, redirects, account | `rememberMe` quyết định storage local vs session |
| `CurrentUser` | identity, roles, email confirmation, profile fields | account page | canonical current-user hydrate |
| `TeacherClassSummary` | `id`, `name`, `code`, `status`, `createdAt`, `activeStudentCount`, `pendingInviteCount` | teacher dashboard | card-based summary |
| `StudentDashboard` | profile snapshot, `activeClasses`, `pendingInvites` | student dashboard | active/pending split rõ ràng |
| `ClassDashboard` | `classId`, `className`, `classCode`, `classStatus`, `timezoneId`, `isTeacherOwner`, `activeStudentCount`, `feedItemCount`, `upcomingScheduleCount`, `unreadNotificationCount` | class dashboard | summary card đầu trang |
| `ClassFeedItem` | `title`, `content`, `postType`, publish window, author, comments, reaction summary | class dashboard | FE hiện chủ yếu dùng `Post`, chưa khai thác `Announcement` |
| `ClassComment` | content, author, edited/hidden state, reactions, mentions | class dashboard | chỉ owner edit; teacher có thể hide |
| `ClassScheduleItem` | `title`, `description`, `scheduleType`, `startAtUtc`, `endAtUtc` | class dashboard | supported types: `Event`, `Deadline`, `Assessment`, `Reminder` |
| `Assessment` | title, instructions, kind, open/close window, items snapshot, status, attempts/results meta | class assessments | state machine `Draft -> Published -> Closed` |
| `StudentAssessmentAttempt` | attempt id, status, answers, submittedAt, scores/results | class assessments | FE hiện chỉnh answer bằng raw JSON textarea |
| `Notification` | title/body, read state, `featureArea`, `classId`, `postId`, `commentId`, `assessmentId`, `linkPath` | notifications | metadata quyết định deep link |
| `Question` | stem, type, tags, status, versions, content payload | question bank | attachments có trong backend nhưng FE chưa show |
| `PaperExamTemplate` / `Version` | template code/name, version number, status, metadata | paper-exam page | assets, validation, publish, binding có ở backend nhưng FE chưa surface |
| `OfflineAssessmentSubmission` | binding version, config hash, payload schema version, review/finalize state | backend only today | cần UI mới nếu scope bao gồm offline grading |

**7. API Mapping By Action**
| Action | API mapping |
|---|---|
| Teacher register | `POST /api/auth/register` |
| Student register | `POST /api/auth/register/student` |
| Login / refresh / logout / session hydrate | `POST /api/auth/login`, `POST /api/auth/refresh-token`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Password + email lifecycle | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/confirm-email`, `POST /api/auth/resend-email-confirmation`, `POST /api/auth/change-password` |
| Teacher class list + create/update/delete | `GET /api/classes`, `POST /api/classes`, `PUT /api/classes/{classId}`, `DELETE /api/classes/{classId}` |
| Student dashboard + invite claim | `GET /api/student/dashboard`, `POST /api/student/invites/claim` |
| Teacher roster import | FE calls `POST /api/classes/{classId}/roster-imports` with JSON; BE controller currently expects multipart upload |
| Class dashboard summary + feed | `GET /api/classes/{classId}/dashboard`, `GET /api/classes/{classId}/feed`, `GET /api/classes/{classId}/mention-candidates` |
| Post/comment management | `POST /api/classes/{classId}/posts`, `PUT /api/classes/{classId}/posts/{postId}`, `POST /api/classes/{classId}/posts/{postId}/comments`, `PUT /api/classes/{classId}/comments/{commentId}`, `DELETE /api/classes/{classId}/comments/{commentId}` |
| Reactions | `PUT /api/classes/{classId}/posts/{postId}/reaction`, `PUT /api/classes/{classId}/comments/{commentId}/reaction` |
| Schedule items | `GET /api/classes/{classId}/schedule-items`, `POST /api/classes/{classId}/schedule-items`, `PUT /api/classes/{classId}/schedule-items/{scheduleItemId}` |
| Assessments | `GET /api/classes/{classId}/assessments`, `POST /api/classes/{classId}/assessments`, `PUT /api/classes/{classId}/assessments/{assessmentId}`, `POST /api/classes/{classId}/assessments/{assessmentId}/publish` |
| Attempts + results | `POST /api/classes/{classId}/assessments/{assessmentId}/attempts`, `PUT /api/classes/{classId}/assessments/attempts/{attemptId}/answers`, `POST /api/classes/{classId}/assessments/attempts/{attemptId}/submit`, `GET /api/classes/{classId}/assessments/{assessmentId}/results` |
| Notifications | `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all` |
| Question bank | `GET/POST /api/question-bank/questions`, `GET/PUT/DELETE /api/question-bank/questions/{questionId}` |
| Paper exam templates | `GET/POST /api/paper-exam/templates`, `POST /api/paper-exam/templates/{templateId}/versions` |
| Backend-only paper exam flows not surfaced in FE | assessment paper binding, offline submission config/submission/review/finalize endpoints exist in BE/docs but need new UI |

**8. Validation Rules**
| Area | Rules with evidence | UI implication |
|---|---|---|
| Auth register | username `3..50`, email valid `<=256`, password `6..100`, confirm must match, full name `<=120`, student code `<=64` | keep clear inline field rules; student and teacher forms are not identical |
| Login | invalid credentials `401`, locked account `403`, email confirmation required `403` with specific code | login UI should preserve dedicated confirm-email-required state |
| Create class | `name` required `2..120`, `code` optional `3..24`; update requires status `Active|Archived` | class create/edit UI needs constrained code/status inputs |
| Invite claim | invite code required `6..128`; invalid/used/expired/email mismatch have distinct server errors | join-class UI should map specific failure copy |
| Roster import | DTO requires `students` non-empty and `sourceFileName <= 200`; FE currently parses textarea | import UI needs confirmation because transport contract is drifting |
| Feed / comments / schedule | teacher-owner gate for post/schedule/hide comment; comment owner edit only; reaction type enum-validated; `endAtUtc > startAtUtc`; schedule title required | role-specific affordances and disabled states matter |
| Feed content emptiness | explicit non-empty validation for post title/content or comment content was not clearly found in service code | `Unknown / Need confirmation`; UI should still avoid empty submissions |
| Assessments | title required; enums validated; content editable only in `Draft`; publish requires at least one item; attempts only when published/open; submitted/closed attempts lock | assessment UI needs stateful controls, not just a generic form |
| Question bank | teacher-only; stem required; question type enum; status enum `Active|Archived` | structured authoring would be safer than raw JSON |
| Paper exams | template code required/unique; publish requires validation success; published versions immutable; offline submission checks binding version/config hash/schema | paper-exam UI must expose immutable published state and strict binding metadata |
| Notifications filters | invalid filter values can error | filter UI should use constrained controls rather than free text |

**9. State Matrix**
| Area | Loading | Empty | Success | Error | Disabled / locked | Permission denied |
|---|---|---|---|---|---|---|
| Route guards | spinner pill `Restoring your session...` | n/a | child route render | redirect to login or role home | n/a | handled by redirect, not 403 page |
| Auth forms | submit spinner/button busy | n/a | redirect or success notice | inline/API notice | submit disabled while request in flight | guest-only routes redirect if already signed in |
| Teacher/student dashboards | card-shell loading state | explicit empty cards/sections | card lists and CTA actions | notice/card error | join/create buttons disabled while submitting | route-level role protection |
| Class dashboard | dashboard/feed/schedule fetch + realtime refresh | empty feed, empty schedule | feed/comments/reactions/schedule render | notice/error blocks | teacher-only controls hidden or locked for student; submitted comment edits limited | non-member/role issues surface via redirect or API error |
| Assessments | fetch dashboard/assessments/results | no assessments / no results | teacher or student workspace | notice/error | draft-only editing, submitted/closed attempt lock, publish/read-only states | route allows teacher/student, finer access enforced in service |
| Notifications | inbox load/refresh | empty inbox state | list with read/open actions | notice/error | mark buttons disabled during mutation | authenticated-only route |
| Question bank | load/create/update/delete busy states | empty list | inline edit list | notice/error | per-row action disable while saving | teacher-only route |
| Paper exams | load/create busy | empty templates | template/version cards | notice/error | published-version immutability should exist in UI if implemented | teacher/admin route |
| Admin dashboard | static | placeholder is effectively empty | placeholder | n/a | n/a | admin-only route |

**10. Permission / RBAC Matrix**
| Capability | Anonymous | Student | Teacher | Admin | Notes |
|---|---|---|---|---|---|
| Login / register / reset / confirm flows | Yes | Redirect away if signed in | Redirect away if signed in | Redirect away if signed in | guest-only for login/register/student-register |
| Account / notifications | No | Yes | Yes | Yes | any authenticated user |
| Teacher dashboard / create class / import roster | No | No | Yes | No | FE teacher-only |
| Student dashboard / claim invite | No | Yes | No | No | FE student-only |
| Open class dashboard | No | Member only | Owner/member only | No direct FE route | service also enforces active membership |
| Create/update post / hide comment / create/update schedule | No | No | Teacher owner only | No direct FE route | fine-grained within shared class screen |
| Comment / react in class | No | Active member | Active member | No direct FE route | feed visibility differs by role |
| Question bank | No | No | Yes | No | backend teacher-only |
| Paper exam templates | No | No | Yes | Yes | FE route allows teacher/admin; backend supports both |
| Assessment create/publish/results | No | No | Teacher owner only | No direct FE route | within shared assessments screen |
| Assessment start/save/submit | No | Active student member | Not primary FE flow | No | teacher-side attempt UX not surfaced |
| Admin dashboard | No | No | No | Yes | FE placeholder only |
| Internal admin APIs | No | No | No | No | require shared-secret header; no FE UI |

**11. Existing FE Patterns Found**

- `Split auth experience`: full-screen hero image + form panel via `AuthEdgeLayout`.
- `CardShell-first layout`: most business pages are composed from rounded cards/panels instead of dense tables.
- `Header action rail`: teacher dashboard uses a top row of quick actions instead of persistent sidebar navigation.
- `Shared class shell`: same `/classes/:classId` screen for teacher and student, with role-specific action visibility.
- `Inline editing`: posts, comments, and question rows edit in-place rather than separate edit screens.
- `Notice + Spinner feedback`: async states and errors rely on notice blocks and a simple spinner component.
- `Raw JSON fallback`: assessments and question bank currently expose complex data through textareas/JSON rather than structured builders.
- `Realtime refresh over optimistic UI`: class dashboard and notifications subscribe to realtime events, then refetch/debounce.
- `Metadata-driven deep link`: notifications open target routes from domain metadata.
- `Pilot frontend tone`: app shell itself labels the FE as a pilot and uses light glass panels over brand gradients.

**12. Relevant Design System Components / Tokens / Patterns**
| DS item | In docs | In shipped FE | Guidance for Figma |
|---|---|---|---|
| Color tokens | Docs use `--color-*` scheme | Code uses `--ui-*` like `--ui-background`, `--ui-surface`, `--ui-brand`, `--ui-danger` | Use shipped `--ui-*` as concrete baseline; note naming drift |
| Typography | Docs define typography rules | Code uses `Geist Variable` + `Geist Mono` | Match current font stack unless design scope includes typography migration |
| `Button` | Yes | Yes | Existing variants: `primary`, `secondary`, `ghost`, `danger` |
| `TextField` | Yes | Yes | Existing shipped primitive |
| `TextareaField` | Implied by form patterns | Yes | Existing shipped primitive |
| `CheckboxField` | Yes | Yes | Existing shipped primitive |
| `CardShell` / panel | Yes | Yes | Primary container pattern in FE |
| `Notice` / feedback callout | Yes | Yes | Primary success/warning/error block today |
| `Spinner` | Yes | Yes | Used in session bootstrap and async actions |
| `AuthEdgeLayout` | Not generic DS doc name, but concrete FE pattern | Yes | Strong current auth visual anchor |
| `DataTable` | Yes in docs | No shared implementation found | If needed, treat as new component/pattern |
| `Badge` / status pills | Yes in docs | No shared primitive found | Current FE uses bespoke pill styling |
| `Avatar` | Yes in docs | No shared primitive found | New component if design needs identity chips |
| `Tabs` | Yes in docs | No shared primitive found | New pattern if introduced |
| `Pagination` | Yes in docs | No shared primitive found | New pattern if introduced |
| `Modal` / overlay | Yes in docs | No shared primitive found | New pattern if introduced |
| `Dropdown` / select | Yes in docs | No shared primitive found | New pattern if introduced |
| `EmptyState` / `Skeleton` | Yes in docs | No reusable primitive found | Current FE mostly uses ad-hoc card copy/spinner |
| Icons / motion / accessibility | Docs require Lucide, reduced motion, 44px touch target, text size minimums | FE already uses Lucide and responsive spacing in key shells | Keep these as hard constraints |

**13. Navigation / Information Architecture Constraints**

- Root route redirects by `primaryRole`; role-based landing is foundational and should remain.
- Route families are explicit: `/teacher/*`, `/student/*`, `/admin/*`, plus shared authenticated routes `/classes/:classId`, `/classes/:classId/assessments`, `/notifications`, `/account`.
- `/teacher/classes/:classId` is legacy and immediately redirects to `/classes/:classId`.
- There is no strong evidence of a persistent left navigation pattern today; page-level quick actions are more established than a full application nav shell.
- Notifications and account are global authenticated destinations.
- Class dashboard and assessments are sibling routes; assessment deep links via `assessmentId` are implemented.
- Notification deep links to feed can carry `postId` and `commentId`, but current class dashboard does not consume those params.
- No dedicated permission-denied screen is present; unauthorized access is mostly redirect or API error.
- Admin information architecture is currently shallow because admin FE is placeholder. `Unknown / Need confirmation` if redesign should establish a real admin nav.

**14. Responsive Behavior If Found**

- Auth experience is explicitly responsive: `AuthEdgeLayout` collapses to a single-column stack on smaller screens and becomes split hero/form on `lg`.
- App shell uses a centered `max-w-7xl` container; header stacks vertically on small screens and becomes horizontal on `md`.
- Auth form spacing expands across `sm` and `lg`; current controls are visually large and touch-friendly.
- Current business pages lean on cards and wrapped action rows rather than dense desktop tables, which is safer for responsive adaptation.
- DS docs define breakpoints, 44px touch targets, minimum mobile body text, and reduced motion; those should be treated as constraints even when current FE is inconsistent.
- Dense responsive behavior for question-bank, assessments, and paper-exam management is not strongly established in current FE. `Unknown / Need confirmation`.

**15. Edge Cases**

- Login can fail with a dedicated `email_confirmation_required` path, not just a generic error.
- Forgot-password and resend-confirmation are privacy-safe; success UI must not leak account existence.
- Confirm-email and reset-password depend on URL params and need explicit invalid-link states.
- Invite claim can fail as invalid, used, expired, or email-mismatch; these should not collapse into one generic toast.
- Non-teachers only see published posts within the allowed publish/close window.
- Only comment owner can edit; teacher owner can hide comments.
- Assessment attempts can be resumed if already in progress; submitted or closed attempts lock editing.
- Publish assessment requires at least one item.
- Notification deep link to assessments is stronger than feed deep link today.
- Paper-exam published versions are immutable; offline submission requires binding/version/config/schema alignment.
- FE roster import expects textarea/JSON while BE controller expects multipart file upload.
- Question-bank attachments exist in backend shape but not in current FE.
- Admin backend capabilities exist beyond what FE currently exposes.

**16. Technical Constraints Impacting Design**

- FE API base is `/api`; auth/session bootstrap is centralized in auth context.
- `rememberMe` changes persistence layer: `localStorage` vs `sessionStorage`.
- Authenticated requests auto-attach bearer token and attempt one refresh on `401` before clearing session.
- Realtime uses SignalR hub `/hubs/realtime` and class room subscription `class:{classId}`.
- Assessment and paper-exam domains are snapshot/version based; UI must respect immutable published states.
- Role gating happens in both FE route guards and BE service/controller checks; hiding buttons alone is not sufficient.
- Notifications depend on metadata fields rather than hardcoded route strings only.
- Design docs and FE implementation diverge; shipped FE uses `--ui-*` tokens and a smaller component set than the docs describe.
- App shell explicitly frames the FE as a pilot; a redesign can elevate fidelity, but it should still respect current contracts and scope.
- Internal admin endpoints rely on shared-secret style auth, which materially affects whether a public admin FE is even appropriate. `Unknown / Need confirmation`.

**17. Recommendations For Figma AI**

- Use shipped FE as the visual/interaction anchor, not the docs alone.
- Preserve current route model and role model exactly: `Teacher`, `Student`, `Admin`; do not invent more roles or new route families.
- Reuse concrete existing primitives: `AuthEdgeLayout`, `CardShell`, `Button`, `TextField`, `TextareaField`, `CheckboxField`, `Notice`, `Spinner`, and the current `--ui-*` token language.
- Keep one shared class workspace for teacher and student, then branch actions and states by role.
- Always design explicit `loading`, `empty`, `success`, `error`, `disabled`, and `permission-denied/redirected` states.
- Treat DS-doc components not found in FE as `new components`, not `already shipped components`.
- Avoid assuming file-upload roster import until product/engineering confirms whether FE will follow current textarea parser or BE multipart contract.
- Prefer constrained inputs for enums and filters; current backend has many enum validations that should not be exposed as free-text fields in the redesigned UI.
- If adding richer assessment/question-bank/paper-exam UX, keep it clearly mapped to existing backend capabilities; do not introduce new domain steps.

| Reuse Existing FE                               | Needs New Design                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Auth split layout and auth form composition     | Rich assessment builder and student attempt UX                                                             |
| Teacher dashboard class-card overview           | Structured question authoring, preview, and attachment UI                                                  |
| Student dashboard join/pending classes sections | Full paper-exam lifecycle: assets, validation, publish, binding, offline review/finalize                   |
| Shared class dashboard feed + schedule shell    | Real admin workspace beyond placeholder                                                                    |
| Notifications inbox list/read pattern           | Advanced notifications filters already supported by BE                                                     |
| Account page summary + password form            | Dedicated permission-denied and richer system states                                                       |
| Existing token/panel/button/input language      | Shared `DataTable`, `Tabs`, `Modal`, `Badge`, `Pagination`, `EmptyState`, `Skeleton` if product wants them |

**18. Open Questions / Missing Information**

- Scope của “giao diện mới” là refresh visual cho màn hiện có, hay bao gồm cả FE-missing flows như paper exams/offline review/admin tools?
- Roster import nên đi theo FE hiện tại `textarea/JSON` hay BE hiện tại `multipart file upload`?
- Teacher register có nên expose `fullName` để khớp DTO và current user profile không?
- Notification deep links tới feed có cần scroll/highlight post/comment cụ thể không?
- Question bank có cần attachments, preview renderer, và picker để kéo câu hỏi sang assessment không?
- Paper exams có cần UI cho binding vào assessment, validate/publish version, submission review/finalize không?
- Có nên xây một global navigation mạnh hơn, hay giữ mô hình page-level action rail hiện tại?
- Có cần một screen `403 / permission denied` riêng thay vì redirect silent?
- Có yêu cầu i18n/localization, timezone formatting policy, hoặc accessibility audit level cụ thể không?
- Có muốn đồng bộ design token naming theo docs `--color-*` hay tiếp tục bám shipped FE `--ui-*`? `Unknown / Need confirmation`.

**A. Prompt For Figma AI**

```text
Design a new UI for examxy, a role-based classroom and assessment web app, while staying faithful to the existing shipped system and backend contracts. Roles are Teacher, Student, and Admin. Keep the current IA and routes: auth flows (/login, /register, /student/register, /forgot-password, /resend-email-confirmation, /confirm-email, /reset-password), teacher routes (/teacher/dashboard, /teacher/classes/new, /teacher/classes/:classId/import, /teacher/question-bank, /teacher/paper-exams), student route (/student/dashboard), shared class routes (/classes/:classId, /classes/:classId/assessments), notifications (/notifications), account (/account), and admin (/admin/dashboard). Reuse existing FE patterns first: split auth hero/form layout, card-based panels, shared class dashboard shell, existing Button/TextField/Textarea/Checkbox/Notice/Spinner primitives, and the shipped --ui-* token language. Do not invent new roles, new domain entities, or new features outside repo/docs. Design explicit loading, empty, success, error, disabled, and permission-denied states. Where the backend supports more than the current FE, you may design missing UI only if it maps directly to existing contracts: richer assessments UX, structured question bank authoring with attachments/preview, advanced notifications filters, paper exam asset/version/binding/offline review flows, and real admin tooling. Mark anything uncertain as Unknown / Need confirmation.
```

**B. Structured JSON For Design Generation**

```json
{
  "product": "examxy",
  "roles": ["Teacher", "Student", "Admin"],
  "globalConstraints": [
    "Preserve existing route structure and role-based landing by primaryRole",
    "Reuse shipped FE primitives before inventing new component systems",
    "Treat docs-only design-system items as new components unless code exists",
    "Do not invent features outside repo/docs",
    "Support explicit loading, empty, success, error, disabled, and permission-denied states",
    "Respect backend enum/state constraints and immutable published/versioned states",
    "Use current FE token language based on --ui-* variables as baseline"
  ],
  "knownDrifts": [
    "Design docs use --color-* token naming but shipped FE uses --ui-*",
    "Teacher roster import FE sends JSON textarea payload, but BE import endpoint expects multipart upload",
    "Notification metadata can include postId/commentId, but class dashboard does not currently consume those deep-link params",
    "Teacher register DTO supports fullName, but current FE register page does not expose it",
    "Question bank attachments and many paper-exam flows exist in backend but not in FE",
    "Admin FE is placeholder while backend internal/admin capabilities are broader"
  ],
  "screens": [
    {
      "name": "Login",
      "route": "/login",
      "status": "existing_fe",
      "purpose": "Authenticate user and create session",
      "sections": [
        "auth hero",
        "credential form",
        "secondary auth links",
        "provider placeholders"
      ],
      "components": [
        "AuthEdgeLayout",
        "TextField",
        "CheckboxField",
        "Button",
        "Notice"
      ],
      "data": [
        "userNameOrEmail",
        "password",
        "rememberMe",
        "emailConfirmationRequiredWarning"
      ],
      "actions": [
        "login",
        "go_register",
        "go_forgot_password",
        "go_resend_confirmation"
      ],
      "api": ["POST /api/auth/login"],
      "permissions": ["guest_only"],
      "states": [
        "bootstrapping",
        "idle",
        "submitting",
        "success_redirect",
        "error",
        "email_confirmation_required"
      ]
    },
    {
      "name": "Teacher Register",
      "route": "/register",
      "status": "existing_fe",
      "purpose": "Create teacher account",
      "sections": ["auth hero", "register form"],
      "components": ["AuthEdgeLayout", "TextField", "Button", "Notice"],
      "data": ["userName", "email", "password", "confirmPassword"],
      "actions": ["register_teacher", "go_login"],
      "api": ["POST /api/auth/register"],
      "permissions": ["guest_only"],
      "states": [
        "idle",
        "submitting",
        "success_redirect",
        "validation_error",
        "conflict_error"
      ],
      "notes": ["fullName exists in DTO but is not exposed in current FE"]
    },
    {
      "name": "Student Register",
      "route": "/student/register",
      "status": "existing_fe",
      "purpose": "Create student account",
      "sections": ["auth hero", "register form"],
      "components": ["AuthEdgeLayout", "TextField", "Button", "Notice"],
      "data": [
        "fullName",
        "userName",
        "studentCode",
        "email",
        "password",
        "confirmPassword"
      ],
      "actions": ["register_student", "go_login"],
      "api": ["POST /api/auth/register/student"],
      "permissions": ["guest_only"],
      "states": [
        "idle",
        "submitting",
        "success_redirect",
        "validation_error",
        "conflict_error"
      ]
    },
    {
      "name": "Forgot Password",
      "route": "/forgot-password",
      "status": "existing_fe",
      "purpose": "Start privacy-safe password reset flow",
      "sections": ["auth hero", "email form", "success notice"],
      "components": ["AuthEdgeLayout", "TextField", "Button", "Notice"],
      "data": ["email"],
      "actions": ["request_reset_email", "go_login"],
      "api": ["POST /api/auth/forgot-password"],
      "permissions": ["public"],
      "states": [
        "idle",
        "submitting",
        "privacy_safe_success",
        "validation_error"
      ]
    },
    {
      "name": "Resend Email Confirmation",
      "route": "/resend-email-confirmation",
      "status": "existing_fe",
      "purpose": "Resend confirmation email in privacy-safe way",
      "sections": ["auth hero", "email form", "success notice"],
      "components": ["AuthEdgeLayout", "TextField", "Button", "Notice"],
      "data": ["email"],
      "actions": ["resend_confirmation_email", "go_login"],
      "api": ["POST /api/auth/resend-email-confirmation"],
      "permissions": ["public"],
      "states": [
        "idle",
        "submitting",
        "privacy_safe_success",
        "validation_error"
      ]
    },
    {
      "name": "Confirm Email",
      "route": "/confirm-email",
      "status": "existing_fe",
      "purpose": "Confirm account from email link",
      "sections": ["auth hero", "status panel"],
      "components": ["AuthEdgeLayout", "Notice", "Button"],
      "data": ["userId", "token", "status"],
      "actions": ["auto_confirm", "go_login"],
      "api": ["POST /api/auth/confirm-email"],
      "permissions": ["public"],
      "states": ["pending", "success", "invalid", "error"]
    },
    {
      "name": "Reset Password",
      "route": "/reset-password",
      "status": "existing_fe",
      "purpose": "Complete password reset from email link",
      "sections": ["auth hero", "password form", "invalid-link state"],
      "components": ["AuthEdgeLayout", "TextField", "Button", "Notice"],
      "data": ["email", "token", "password", "confirmPassword"],
      "actions": ["reset_password", "go_login"],
      "api": ["POST /api/auth/reset-password"],
      "permissions": ["public"],
      "states": ["invalid_link", "idle", "submitting", "success", "error"]
    },
    {
      "name": "Teacher Dashboard",
      "route": "/teacher/dashboard",
      "status": "existing_fe",
      "purpose": "Teacher landing and class overview",
      "sections": ["header action rail", "class card grid", "empty state"],
      "components": ["CardShell", "Button", "Notice"],
      "data": ["classSummaries", "classCounts", "pendingInviteCounts"],
      "actions": [
        "create_class",
        "open_class",
        "open_assessments",
        "import_roster",
        "open_notifications",
        "open_question_bank",
        "open_paper_exams",
        "open_account"
      ],
      "api": ["GET /api/classes"],
      "permissions": ["teacher_only"],
      "states": ["loading", "empty", "success", "error"]
    },
    {
      "name": "Create Teacher Class",
      "route": "/teacher/classes/new",
      "status": "existing_fe",
      "purpose": "Create a new classroom",
      "sections": ["class form"],
      "components": ["CardShell", "TextField", "Button", "Notice"],
      "data": ["name", "code"],
      "actions": ["create_class", "cancel"],
      "api": ["POST /api/classes"],
      "permissions": ["teacher_only"],
      "states": [
        "idle",
        "submitting",
        "success_redirect",
        "validation_error",
        "conflict_error"
      ]
    },
    {
      "name": "Teacher Class Import",
      "route": "/teacher/classes/:classId/import",
      "status": "existing_fe_with_contract_drift",
      "purpose": "Import class roster",
      "sections": [
        "source form",
        "raw roster textarea",
        "parsed preview",
        "batch results"
      ],
      "components": [
        "CardShell",
        "TextField",
        "TextareaField",
        "Button",
        "Notice"
      ],
      "data": [
        "sourceFileName",
        "rawRoster",
        "parsedStudents",
        "importResults"
      ],
      "actions": ["parse_roster", "submit_import"],
      "api": ["POST /api/classes/{classId}/roster-imports"],
      "permissions": ["teacher_only"],
      "states": ["idle", "parsing", "submitting", "success", "error"],
      "notes": [
        "BE currently expects multipart upload instead of FE JSON payload"
      ]
    },
    {
      "name": "Student Dashboard",
      "route": "/student/dashboard",
      "status": "existing_fe",
      "purpose": "Student landing, invite claim, and class overview",
      "sections": [
        "join-class card",
        "profile snapshot",
        "active classes",
        "pending invites"
      ],
      "components": ["CardShell", "TextField", "Button", "Notice"],
      "data": ["profile", "activeClasses", "pendingInvites", "inviteCodeQuery"],
      "actions": [
        "claim_invite",
        "open_class",
        "open_assessments",
        "refresh_dashboard"
      ],
      "api": ["GET /api/student/dashboard", "POST /api/student/invites/claim"],
      "permissions": ["student_only"],
      "states": [
        "loading",
        "empty_sections",
        "auto_claiming",
        "success",
        "error"
      ]
    },
    {
      "name": "Class Dashboard",
      "route": "/classes/:classId",
      "status": "existing_fe",
      "purpose": "Shared teacher/student class workspace",
      "sections": [
        "class summary",
        "teacher composer",
        "feed",
        "comment threads",
        "right-column shortcuts",
        "schedule list"
      ],
      "components": [
        "CardShell",
        "TextField",
        "TextareaField",
        "Button",
        "Notice",
        "MentionCandidatePicker"
      ],
      "data": [
        "classDashboard",
        "feedItems",
        "comments",
        "reactions",
        "scheduleItems",
        "mentionCandidates"
      ],
      "actions": [
        "create_post",
        "update_post",
        "create_comment",
        "update_comment",
        "hide_comment",
        "react_post",
        "react_comment",
        "create_schedule",
        "update_schedule",
        "open_notifications",
        "open_assessments"
      ],
      "api": [
        "GET /api/classes/{classId}/dashboard",
        "GET /api/classes/{classId}/feed",
        "GET /api/classes/{classId}/schedule-items",
        "GET /api/classes/{classId}/mention-candidates",
        "POST /api/classes/{classId}/posts",
        "PUT /api/classes/{classId}/posts/{postId}",
        "POST /api/classes/{classId}/posts/{postId}/comments",
        "PUT /api/classes/{classId}/comments/{commentId}",
        "DELETE /api/classes/{classId}/comments/{commentId}",
        "PUT /api/classes/{classId}/posts/{postId}/reaction",
        "PUT /api/classes/{classId}/comments/{commentId}/reaction",
        "POST /api/classes/{classId}/schedule-items",
        "PUT /api/classes/{classId}/schedule-items/{scheduleItemId}"
      ],
      "permissions": [
        "teacher_or_student_member",
        "teacher_owner_for_post_schedule_moderation"
      ],
      "states": [
        "loading",
        "empty_feed",
        "empty_schedule",
        "success",
        "error",
        "role_locked"
      ],
      "realtime": ["SignalR /hubs/realtime", "room class:{classId}"]
    },
    {
      "name": "Class Assessments",
      "route": "/classes/:classId/assessments",
      "status": "existing_fe_low_fidelity",
      "purpose": "Assessment authoring and attempt workspace",
      "sections": [
        "summary",
        "teacher draft form",
        "assessment list",
        "results panel",
        "student attempt editor"
      ],
      "components": [
        "CardShell",
        "TextField",
        "TextareaField",
        "Button",
        "Notice"
      ],
      "data": ["assessments", "focusedAssessmentId", "attempt", "results"],
      "actions": [
        "create_assessment",
        "update_assessment",
        "publish_assessment",
        "start_attempt",
        "save_answers",
        "submit_attempt",
        "load_results"
      ],
      "api": [
        "GET /api/classes/{classId}/assessments",
        "POST /api/classes/{classId}/assessments",
        "PUT /api/classes/{classId}/assessments/{assessmentId}",
        "POST /api/classes/{classId}/assessments/{assessmentId}/publish",
        "POST /api/classes/{classId}/assessments/{assessmentId}/attempts",
        "PUT /api/classes/{classId}/assessments/attempts/{attemptId}/answers",
        "POST /api/classes/{classId}/assessments/attempts/{attemptId}/submit",
        "GET /api/classes/{classId}/assessments/{assessmentId}/results"
      ],
      "permissions": [
        "teacher_or_student_member",
        "teacher_owner_for_authoring_publish_results"
      ],
      "states": [
        "loading",
        "empty",
        "success",
        "error",
        "draft_editable",
        "published_read_only",
        "attempt_in_progress",
        "attempt_submitted_locked"
      ]
    },
    {
      "name": "Notifications",
      "route": "/notifications",
      "status": "existing_fe_partial_filters",
      "purpose": "Account-level notification inbox",
      "sections": ["filter bar", "notification list"],
      "components": ["CardShell", "Button", "Notice"],
      "data": [
        "notifications",
        "onlyUnread",
        "classId",
        "featureArea",
        "assessmentId",
        "postId",
        "commentId"
      ],
      "actions": ["refresh", "mark_one_read", "mark_all_read", "open_target"],
      "api": [
        "GET /api/notifications",
        "POST /api/notifications/{id}/read",
        "POST /api/notifications/read-all"
      ],
      "permissions": ["authenticated"],
      "states": ["loading", "empty", "success", "error", "mutating"],
      "notes": [
        "BE supports scope, sourceType, and notificationType filters beyond current FE controls"
      ]
    },
    {
      "name": "Question Bank",
      "route": "/teacher/question-bank",
      "status": "existing_fe_partial",
      "purpose": "Teacher question authoring and management",
      "sections": ["create form", "question list", "inline edit"],
      "components": [
        "CardShell",
        "TextField",
        "TextareaField",
        "Button",
        "Notice"
      ],
      "data": ["questions", "stem", "type", "tags", "status", "currentVersion"],
      "actions": [
        "create_question",
        "update_question",
        "delete_question",
        "inspect_question"
      ],
      "api": [
        "GET /api/question-bank/questions",
        "POST /api/question-bank/questions",
        "GET /api/question-bank/questions/{questionId}",
        "PUT /api/question-bank/questions/{questionId}",
        "DELETE /api/question-bank/questions/{questionId}"
      ],
      "permissions": ["teacher_only"],
      "states": ["loading", "empty", "success", "error", "inline_editing"],
      "notes": ["No FE support yet for attachments or richer preview"]
    },
    {
      "name": "Paper Exam Templates",
      "route": "/teacher/paper-exams",
      "status": "existing_fe_partial_major_backend_gap",
      "purpose": "Manage paper exam templates and versions",
      "sections": [
        "template create form",
        "template list",
        "version create form",
        "version list"
      ],
      "components": [
        "CardShell",
        "TextField",
        "TextareaField",
        "Button",
        "Notice"
      ],
      "data": [
        "templates",
        "versions",
        "templateCode",
        "templateName",
        "versionMetadata"
      ],
      "actions": ["create_template", "create_version"],
      "api": [
        "GET /api/paper-exam/templates",
        "POST /api/paper-exam/templates",
        "POST /api/paper-exam/templates/{templateId}/versions"
      ],
      "permissions": ["teacher_or_admin"],
      "states": ["loading", "empty", "success", "error"],
      "notes": ["Backend supports many more flows than current FE exposes"]
    },
    {
      "name": "Account",
      "route": "/account",
      "status": "existing_fe",
      "purpose": "Identity snapshot and password management",
      "sections": [
        "profile summary",
        "session summary",
        "email confirmation status",
        "change password form"
      ],
      "components": ["CardShell", "TextField", "Button", "Notice"],
      "data": ["currentUser", "roles", "emailConfirmed", "sessionMetadata"],
      "actions": ["change_password", "logout"],
      "api": [
        "GET /api/auth/me",
        "POST /api/auth/change-password",
        "POST /api/auth/logout"
      ],
      "permissions": ["authenticated"],
      "states": ["loading", "success", "validation_error", "error"]
    },
    {
      "name": "Admin Dashboard",
      "route": "/admin/dashboard",
      "status": "existing_fe_placeholder",
      "purpose": "Admin landing placeholder",
      "sections": ["placeholder card"],
      "components": ["CardShell"],
      "data": ["placeholderCopy"],
      "actions": [],
      "api": [],
      "permissions": ["admin_only"],
      "states": ["static_placeholder"]
    }
  ],
  "systemScreens": [
    {
      "name": "Root Redirect",
      "route": "/",
      "purpose": "Redirect based on session primaryRole",
      "permissions": ["all"],
      "states": ["bootstrapping", "redirect"]
    },
    {
      "name": "Not Found",
      "route": "*",
      "purpose": "Fallback route",
      "permissions": ["all"],
      "states": ["static"]
    }
  ],
  "newDesignTargets": [
    "Richer assessment authoring and student attempt UX",
    "Structured question-bank authoring, preview, and attachment handling",
    "Advanced notifications filtering controls",
    "Complete paper-exam flow UI: assets, validation, publish, binding, offline review/finalize",
    "Real admin workspace",
    "Reusable system states and potentially new shared components like DataTable, Tabs, Modal, Badge, Pagination, EmptyState, Skeleton"
  ]
}
```
