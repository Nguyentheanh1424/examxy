Dưới đây là `Design Generation Spec` ở mức screen-design, tối ưu để Figma AI dựng layout, hierarchy và interaction. Tôi bám vào FE hiện có làm baseline; chỗ nào nên mở rộng tôi chỉ nêu theo hướng UI, không suy diễn thêm domain.

**Auth Screens**

**Login**

- Layout structure: split-screen; trái là hero visual full-height, phải là auth panel căn giữa với chiều rộng hẹp; mobile chuyển thành stack dọc, form lên trước nội dung phụ.
- UI hierarchy tree: `Page > AuthEdgeLayout > HeroRegion + FormRegion > Brand/Heading > Alert/Notice > Form > UserNameOrEmailField + PasswordField + RememberCheckbox > PrimaryCTA > SecondaryLinks > ProviderPlaceholderButtons`
- UX intent: hoàn thành đăng nhập nhanh nhất; ưu tiên tuyệt đối cho credential form; cảm giác tin cậy, ít nhiễu.
- Interaction model: submit trong trang, validate inline, lỗi hiển thị ngay trong panel; link điều hướng sang register/forgot/resend; không dùng modal.
- Visual density + complexity: mật độ trung bình, độ phức tạp thấp.
- Suggested layout pattern: `split auth layout + centered single-column form`.

**Teacher Register**

- Layout structure: giữ cùng khung split auth như login; form dài hơn nhưng vẫn một cột; phần legal/help text ở cuối form.
- UI hierarchy tree: `Page > AuthEdgeLayout > HeroRegion + FormRegion > Heading/Subcopy > Form > UserName + Email + Password + ConfirmPassword > PrimaryCTA > FooterLinks`
- UX intent: onboarding teacher rõ ràng, ít bước, giảm lo lắng; ưu tiên hoàn tất form hơn là giải thích dài.
- Interaction model: form submit trong trang, inline validation, success rồi redirect; không modal, không multi-step.
- Visual density + complexity: mật độ trung bình, độ phức tạp thấp.
- Suggested layout pattern: `single-column registration form in auth shell`.

**Student Register**

- Layout structure: cùng auth shell; form dài hơn teacher register nên cần rhythm spacing rõ hơn; mobile ưu tiên scroll mượt.
- UI hierarchy tree: `Page > AuthEdgeLayout > HeroRegion + FormRegion > Heading/Subcopy > Form > FullName + UserName + StudentCode + Email + Password + ConfirmPassword > PrimaryCTA > FooterLinks`
- UX intent: thu đủ thông tin student nhưng vẫn cảm giác nhẹ; ưu tiên clarity vì số field nhiều hơn.
- Interaction model: inline validation, submit trong trang, success redirect; không chia step nếu chưa có căn cứ cần wizard.
- Visual density + complexity: mật độ trung bình-cao, độ phức tạp thấp-trung bình.
- Suggested layout pattern: `long-form registration layout`.

**Forgot Password**

- Layout structure: auth shell; panel phải gọn, một form ngắn và vùng success state rõ ràng.
- UI hierarchy tree: `Page > AuthEdgeLayout > FormRegion > Heading/Subcopy > Notice(optional) > Form > EmailField > PrimaryCTA > BackToLoginLink`
- UX intent: trấn an và hoàn thành một hành động duy nhất; giảm nghi ngờ về việc tài khoản có tồn tại hay không.
- Interaction model: submit trong trang, sau submit chuyển sang success panel cùng vị trí; không modal.
- Visual density + complexity: mật độ thấp, độ phức tạp thấp.
- Suggested layout pattern: `single-action recovery form`.

**Resend Email Confirmation**

- Layout structure: giống forgot-password; một panel hẹp, form ngắn, success state thay thế nội dung form.
- UI hierarchy tree: `Page > AuthEdgeLayout > FormRegion > Heading/Subcopy > Form > EmailField > PrimaryCTA > BackToLoginLink`
- UX intent: xử lý tình huống chặn đăng nhập thật nhanh; nhấn mạnh “check email” hơn là technical details.
- Interaction model: submit trong trang, success state trong cùng panel.
- Visual density + complexity: mật độ thấp, độ phức tạp thấp.
- Suggested layout pattern: `single-action auth support screen`.

**Confirm Email**

- Layout structure: auth shell; panel nội dung gần như một status card lớn ở giữa.
- UI hierarchy tree: `Page > AuthEdgeLayout > FormRegion > StatusCard > Icon/StatusBadge > Heading > Message > PrimaryCTA`
- UX intent: phản hồi rõ trạng thái từ link email; ưu tiên clarity hơn thao tác.
- Interaction model: auto-processing khi mở trang; sau đó hiển thị `pending/success/invalid/error`; không form dài.
- Visual density + complexity: mật độ thấp, độ phức tạp thấp.
- Suggested layout pattern: `centered status / result screen`.

**Reset Password**

- Layout structure: auth shell; nếu link hợp lệ thì là form ngắn; nếu link sai thì là invalid state card.
- UI hierarchy tree: `Page > AuthEdgeLayout > FormRegion > ConditionalState > InvalidStateCard | ResetFormCard > Password + ConfirmPassword > PrimaryCTA > SecondaryLink`
- UX intent: hoàn tất reset an toàn và dứt khoát; tránh làm người dùng phân vân bước kế tiếp.
- Interaction model: validate inline, submit trong trang, success state thay thế form; không modal.
- Visual density + complexity: mật độ thấp-trung bình, độ phức tạp thấp.
- Suggested layout pattern: `conditional form / status auth screen`.

**Main Workspaces**

**Teacher Dashboard**

- Layout structure: đầu trang là intro + action rail; dưới là grid các class cards; empty state chiếm vùng content chính khi chưa có lớp.
- UI hierarchy tree: `Page > Header > Title/Description + GlobalActions > Main > ClassGrid > ClassCard > Meta + Stats + ActionRow`
- UX intent: giúp teacher scan lớp nhanh và vào đúng workflow chỉ với 1 click; ưu tiên discoverability của actions chính.
- Interaction model: navigation-first; card click và action buttons trực tiếp; không inline edit trên dashboard.
- Visual density + complexity: mật độ trung bình, độ phức tạp trung bình.
- Suggested layout pattern: `dashboard header + card grid`.

**Create Teacher Class**

- Layout structure: một form card trung tâm trong shell chung; có header ngắn, body form, footer action.
- UI hierarchy tree: `Page > ContentContainer > FormCard > Heading/Subcopy > Form > NameField + CodeField > FooterActions`
- UX intent: tạo lớp nhanh, ít ma sát; chỉ một mục tiêu duy nhất.
- Interaction model: in-page form submit, validation inline; cancel/back bằng navigation.
- Visual density + complexity: mật độ thấp, độ phức tạp thấp.
- Suggested layout pattern: `centered creation form`.

**Teacher Class Import**

- Layout structure: hai vùng chính; trên là form nhập nguồn, dưới là parsed preview hoặc import result; desktop có thể là 2 cột `input | preview/results`.
- UI hierarchy tree: `Page > Header > Title/HelpCopy > Main > InputCard + PreviewOrResultCard > Textarea/Input > Parse/ImportActions > ResultSummary > ResultList`
- UX intent: giảm rủi ro import sai bằng preview rõ ràng trước khi commit; ưu tiên readability của dữ liệu hàng loạt.
- Interaction model: staged interaction trong cùng trang: paste data -> preview -> import -> review result; không modal nếu chưa cần xác nhận phá vỡ flow.
- Visual density + complexity: mật độ trung bình-cao, độ phức tạp trung bình.
- Suggested layout pattern: `two-panel import workspace`.

**Student Dashboard**

- Layout structure: bố cục dashboard nhẹ; trên là join-class card, dưới là hai section `active classes` và `pending invites`; profile snapshot là card phụ.
- UI hierarchy tree: `Page > Header > Title/Description + RefreshAction > Main > JoinCard + ProfileCard + ActiveClassesSection + PendingInvitesSection`
- UX intent: orient student thật nhanh về “mình đang ở đâu” và “làm gì tiếp theo”; ưu tiên join/open class.
- Interaction model: submit join inline, cards để navigate, refresh nhẹ trong trang.
- Visual density + complexity: mật độ trung bình, độ phức tạp thấp-trung bình.
- Suggested layout pattern: `light dashboard with stacked sections`.

**Class Dashboard**

- Layout structure: layout 2 cột trên desktop; cột trái rộng cho feed/composer, cột phải hẹp cho class meta, shortcuts, schedule; mobile xếp dọc theo thứ tự summary -> composer -> feed -> schedule.
- UI hierarchy tree: `Page > ClassHeaderCard > MainSplit > LeftColumn > TeacherComposer(optional) + FeedList > FeedItem > CommentThread > RightColumn > ClassMetaCard + ShortcutCard + ScheduleCard`
- UX intent: là workspace trung tâm của lớp; ưu tiên đọc feed, tương tác nhanh, và thấy bối cảnh lớp cùng lúc.
- Interaction model: inline create/edit cho post, comment, schedule; reactions trực tiếp; mention picker overlay nhỏ; navigation sang assessments/notifications từ shortcut.
- Visual density + complexity: mật độ cao, độ phức tạp cao.
- Suggested layout pattern: `activity workspace + side rail`.

**Class Assessments**

- Layout structure: header context lớp + nội dung chia theo role; teacher nên thấy `authoring area + assessment list`, student nên thấy `assessment list + focused attempt panel`; desktop có thể split, mobile chuyển thành sections tuần tự.
- UI hierarchy tree: `Page > Header > Title/Context > RoleAwareMain > TeacherView > DraftComposer + AssessmentList + ResultsPanel | StudentView > AssessmentList + FocusPanel + AttemptEditor`
- UX intent: teacher cần quản lý vòng đời assessment; student cần hoàn thành attempt với tập trung cao. Mục tiêu hai vai trò khác nhau nhưng cùng route.
- Interaction model: teacher dùng inline create/update/publish; student dùng focused task flow với save/submit rõ ràng; tránh modal-heavy vì flow đã phức tạp.
- Visual density + complexity: mật độ cao, độ phức tạp cao.
- Suggested layout pattern: `role-aware management workspace`.

**Notifications**

- Layout structure: một cột nội dung chính với filter bar phía trên; danh sách notification theo chiều dọc; action global nằm trong header/filter bar.
- UI hierarchy tree: `Page > Header > Title + GlobalActions > FilterBar > List > NotificationItem > StatusDot + Content + Meta + Action`
- UX intent: scan nhanh, phân biệt unread/read rõ, và mở đúng target ngay; ưu tiên clarity của trạng thái hơn trang trí.
- Interaction model: navigation list; mark-read inline; filter trong cùng trang; không modal.
- Visual density + complexity: mật độ trung bình, độ phức tạp thấp-trung bình.
- Suggested layout pattern: `inbox list layout`.

**Question Bank**

- Layout structure: desktop nên là `authoring / filters` ở một vùng và `question list` ở vùng còn lại; mobile chuyển thành stack `create form -> list`; mỗi question là card có summary + inline edit.
- UI hierarchy tree: `Page > Header > Title/Actions > Main > CreateOrFilterPanel + QuestionList > QuestionCard > Summary + Tags/Status + ExpandableEditArea`
- UX intent: hỗ trợ teacher scan, chỉnh và tái sử dụng câu hỏi; ưu tiên khả năng duyệt danh sách và chỉnh sửa nhanh.
- Interaction model: inline edit, expand/collapse per item, create trong cùng trang; không đẩy sang nhiều sub-pages nếu chưa cần.
- Visual density + complexity: mật độ cao, độ phức tạp trung bình-cao.
- Suggested layout pattern: `management list with inline authoring`.

**Paper Exam Templates**

- Layout structure: trang quản trị theo chiều dọc; trên là template creation, dưới là list templates, mỗi template chứa vùng versions; desktop có thể dùng master-detail nhẹ.
- UI hierarchy tree: `Page > Header > Title/Description > Main > TemplateCreateCard + TemplateList > TemplateCard > TemplateMeta + VersionCreateArea + VersionList`
- UX intent: quản lý cấu trúc template/version rõ ràng và version-first; ưu tiên hiểu mối quan hệ cha-con giữa template và version.
- Interaction model: create inline ở cấp template và version; list expansion để xem versions; không modal là mặc định.
- Visual density + complexity: mật độ trung bình-cao, độ phức tạp trung bình.
- Suggested layout pattern: `hierarchical management list`.

**Account**

- Layout structure: page chia thành các cards độc lập; một card profile/session summary, một card password change, một card actions/account status.
- UI hierarchy tree: `Page > Header > Title/Description > Main > ProfileCard + SessionCard + PasswordCard + AccountActionCard`
- UX intent: tạo cảm giác kiểm soát và minh bạch về tài khoản; ưu tiên nhiệm vụ “đổi mật khẩu” và “xem trạng thái xác thực”.
- Interaction model: form submit trong trang, actions trực tiếp, không modal trừ khi sau này cần xác nhận sign-out all sessions.
- Visual density + complexity: mật độ trung bình, độ phức tạp thấp.
- Suggested layout pattern: `settings page with stacked cards`.

**Admin Dashboard**

- Layout structure: hiện nên là một placeholder dashboard card với vùng cho future modules; đừng overdesign như có đầy đủ tính năng.
- UI hierarchy tree: `Page > Header > Title/Description > PlaceholderCard > CurrentState + FutureModules`
- UX intent: báo trạng thái hệ thống admin FE chưa đầy đủ, nhưng vẫn giữ không gian để mở rộng.
- Interaction model: chủ yếu navigation placeholder; chưa có inline edit hay workflow phức tạp.
- Visual density + complexity: mật độ thấp, độ phức tạp thấp.
- Suggested layout pattern: `placeholder admin landing`.

**System / Utility Screens**

**Not Found**

- Layout structure: một khối trung tâm, nhiều khoảng thở, CTA quay lại rõ ràng.
- UI hierarchy tree: `Page > CenteredCard > ErrorCode/Illustration > Heading > SupportCopy > PrimaryCTA`
- UX intent: giảm cảm giác “đi vào ngõ cụt”, đưa người dùng quay lại flow chính nhanh.
- Interaction model: navigation only.
- Visual density + complexity: mật độ thấp, độ phức tạp thấp.
- Suggested layout pattern: `centered empty/error state`.

**Root Redirect / Session Restore**

- Layout structure: không phải screen business; chỉ cần transition state tối giản với spinner pill hoặc splash nhỏ.
- UI hierarchy tree: `Page > CenteredStatus > Spinner + Message`
- UX intent: báo hệ thống đang restore session, tránh blank screen.
- Interaction model: tự động redirect sau bootstrap.
- Visual density + complexity: mật độ rất thấp, độ phức tạp rất thấp.
- Suggested layout pattern: `minimal transitional state`.
