# Examxy AI Coding Agent Project Guide

**Phiên bản:** 1.0  
**Trạng thái:** Active  
**Phạm vi:** Tài liệu vận hành cho AI agent hỗ trợ code trong toàn bộ project Examxy  
**Nguồn thiết kế gốc:** Examxy Design System (EDS) v3.0

---

## 1. Mục tiêu

Tài liệu này định nghĩa cách một AI coding agent phải đọc, sinh, sửa, review và đồng bộ mã nguồn trong project Examxy để:

- giữ nguyên toàn bộ thiết kế đã được xác lập trong EDS v3.0;
- tránh sinh code rời rạc, trùng lặp, khó bảo trì;
- biến Design System thành **nguồn sự thật duy nhất** cho UI;
- đảm bảo mọi thay đổi đều được cập nhật đồng bộ giữa token, component, feature, tài liệu và test.

> **Nguyên tắc tối cao:** tài liệu này **bổ sung** cho EDS v3.0, không thay thế. Khi có xung đột, **EDS v3.0 luôn thắng**.

---

## 2. Quan hệ giữa AI Agent và EDS v3.0

AI agent chỉ được phép mở rộng project theo hướng **tuân thủ contract đã có**, tuyệt đối không được tự ý tái định nghĩa ngôn ngữ thiết kế.

### 2.1. Những gì phải giữ nguyên

AI agent phải giữ nguyên các định nghĩa cốt lõi sau:

1. **Functional Minimalism** làm định hướng thẩm mỹ chính.
2. **Tailwind CSS** là lớp triển khai giao diện chính.
3. **OKLCH + CSS Variables + Tailwind theme extension** là chuẩn quản trị màu.
4. **Geist Sans / Geist Mono** là hệ font mặc định.
5. **Fluid typography** với body text mobile không nhỏ hơn `16px`.
6. **Responsive Bento Grid** là tư duy layout chính.
7. **Mobile touch target tối thiểu 44px** cho mọi interactive element.
8. **Lucide Icons** là nguồn icon chuẩn.
9. **Motion phải hỗ trợ reduced motion**.
10. **5 component contract cốt lõi** phải được bảo toàn:

- Button
- Multiple Choice Option
- Text Field
- Data Table
- OMR Scanner Viewfinder

11. **WCAG 2.2** là baseline bắt buộc.
12. **Tone of voice chuyên nghiệp, gần gũi, tích cực** phải nhất quán ở mọi copy UI.

### 2.2. Những gì AI agent không được phép làm

AI agent không được:

- thay màu bằng HEX/HSL rời rạc nếu token đã tồn tại trong hệ thống;
- tự thêm icon ngoài Lucide khi chưa có phê duyệt thiết kế;
- tạo component mới nếu có thể giải quyết bằng variant/slot của component hiện hữu;
- hard-code typography, spacing, radius, shadow, breakpoint theo cảm tính;
- tạo nhiều cách viết khác nhau cho cùng một pattern UI;
- thêm animation không nằm trong triết lý motion hiện có;
- dùng màu sắc như tín hiệu duy nhất cho trạng thái lỗi/thành công/cảnh báo;
- tạo shortcut “code cho nhanh” nhưng làm lệch contract của component.

---

## 3. Kiến trúc nguồn sự thật duy nhất (Single Source of Truth)

Để mã nguồn không bị phân mảnh, toàn project phải có cấu trúc nguồn sự thật duy nhất như sau.

## 3.1. Nguồn sự thật theo từng lớp

| Lớp                    | Nguồn sự thật duy nhất                                | Không được phép                               |
| ---------------------- | ----------------------------------------------------- | --------------------------------------------- | --------------------------------- |
| Color tokens           | `src/styles/tokens.css` hoặc `app/globals.css`        | Khai báo màu rời rạc trong component          |
| Tailwind theme         | `tailwind.config.(js                                  | ts)`                                          | Tự định nghĩa lại token ở file lẻ |
| Typography scale       | Tailwind theme + CSS font variables                   | Set font-size thủ công lặp lại ở nhiều nơi    |
| Motion/easing/duration | Tailwind theme extension                              | Viết easing rời rạc trong từng component      |
| Icons                  | `lucide-react` + shared icon wrapper                  | SVG lẻ, icon font, nhiều bộ icon              |
| UI primitives          | `src/components/ui/*`                                 | Tạo lại button/input/table ở từng feature     |
| Feature-specific UI    | `src/features/<feature>/components/*`                 | Đặt business UI lẫn với ui primitives         |
| Domain types           | `src/types/*` hoặc `src/features/<feature>/types.ts`  | Khai báo type trùng nhau ở nhiều file         |
| Copy chuẩn             | `src/constants/copy/*` hoặc feature-local copy module | Hard-code message cùng nghĩa ở nhiều nơi      |
| Docs chuẩn             | `docs/*`                                              | Giải thích hành vi chỉ nằm trong code comment |
| Test contract          | `tests/*`, `*.test.*`, `*.spec.*`                     | Chỉ test happy path bằng tay                  |

## 3.2. Cấu trúc thư mục khuyến nghị

```txt
src/
  app/ or pages/
  styles/
    tokens.css
    globals.css
  components/
    ui/
      button/
      text-field/
      multiple-choice-option/
      data-table/
      omr-viewfinder/
      icon/
    layouts/
  features/
    exams/
    omr/
    dashboard/
    grading/
  lib/
    utils/
    accessibility/
    motion/
    formatting/
  hooks/
  constants/
    copy/
    routes/
  types/
  services/
  stores/

docs/
  design-system/
  architecture/
  conventions/
  adr/
  ai-agent/

tests/
  accessibility/
  integration/
  visual/
```

### 3.3. Quy tắc phân lớp bắt buộc

- `components/ui` chỉ chứa **primitive hoặc shared patterns**.
- Không được duy trì cây component song song kiểu staging/reference bên trong `src/components/ui/components/*`; mọi shared UI chạy thật phải nằm trực tiếp dưới `src/components/ui/*`.
- `features/*` chứa UI gắn với nghiệp vụ.
- `lib/*` chứa logic tái sử dụng thuần túy, không phụ thuộc feature cụ thể.
- `services/*` chứa giao tiếp API/external IO.
- `types/*` chứa domain contract dùng chung.
- `docs/*` phải phản ánh kiến trúc thật, không được để lệch với code hiện tại.

---

## 4. Quy tắc vận hành cho AI coding agent

## 4.1. Workflow bắt buộc trước khi viết code

Trước mọi thay đổi, AI agent phải thực hiện tuần tự:

1. **Đọc contract hiện có**: xác định component, token, variant, state, naming pattern và thư mục liên quan.
2. **Audit khả năng tái sử dụng**: ưu tiên sửa/extend component hiện có thay vì tạo mới.
3. **Xác định phạm vi ảnh hưởng**: UI, type, test, docs, accessibility, motion, copy.
4. **Chọn thay đổi nhỏ nhất có ý nghĩa**: không refactor lan rộng nếu không cần.
5. **Cập nhật đồng bộ tất cả lớp bị ảnh hưởng** trước khi kết thúc.

## 4.2. Workflow bắt buộc sau khi viết code

Sau khi sửa code, AI agent phải tự kiểm tra:

1. component còn đúng contract EDS không;
2. class Tailwind có dùng đúng token/theme không;
3. state hover/focus/disabled/error/loading đã đầy đủ chưa;
4. mobile hitbox 44px có bị vi phạm không;
5. aria/focus ring/keyboard navigation có đầy đủ không;
6. type, test, story/docs, snapshot có cần cập nhật không;
7. có tạo duplication hoặc utility mới không cần thiết không.

## 4.3. Nguyên tắc ra quyết định

Khi có nhiều cách triển khai, AI agent phải ưu tiên theo thứ tự:

1. **Tái sử dụng pattern hiện có**
2. **Mở rộng bằng variant/slot/prop**
3. **Tách shared abstraction nhỏ, rõ ràng**
4. **Tạo component mới** chỉ khi 3 bước trên không giải quyết được

---

## 5. Bộ rule bắt buộc để mã nguồn luôn đồng bộ

## 5.1. Rule 01 - Một token, một nơi định nghĩa

- Màu, font, easing, duration, border radius, shadow, spacing đặc thù chỉ được định nghĩa ở nơi gốc.
- Component chỉ **consume token**, không tái định nghĩa token.
- Nếu thiếu token, phải thêm vào layer token/theme trước, rồi mới dùng trong component.

## 5.2. Rule 02 - Không tạo component song song khác nghĩa

Không được để tồn tại nhiều implementation cho cùng một khái niệm UI, ví dụ:

- `PrimaryButton`, `MainButton`, `ActionButton` cùng vai trò
- `Input`, `TextInput`, `FormInput` nhưng style/behavior khác nhau
- `Table`, `DataGrid`, `ListTable` nhưng cùng use case

Nếu cùng vai trò, phải hợp nhất về **một component chuẩn** với variant rõ ràng.

## 5.3. Rule 03 - Mọi trạng thái phải được mô hình hóa tập trung

Mỗi component chuẩn phải có bảng state rõ ràng:

- default
- hover
- focus-visible
- active
- disabled
- loading
- success/error/warning (nếu áp dụng)
- selected/checked (nếu áp dụng)

Không được để state chỉ tồn tại ở CSS ngẫu nhiên mà không được định danh trong docs hoặc API props.

## 5.4. Rule 04 - Mọi thay đổi UI phải kéo theo cập nhật phụ trợ

Bất kỳ thay đổi nào ở UI đều phải xem xét đồng thời:

- docs
- type/interface
- tests
- story/demo
- accessibility label/aria
- loading/empty/error state
- responsive behavior

Không chấp nhận thay đổi “xong phần giao diện” nhưng bỏ sót các lớp phụ trợ.

## 5.5. Rule 05 - Shared logic phải được tách, nhưng chỉ khi thật sự shared

- Logic được dùng từ 2 nơi trở lên và cùng một ý nghĩa -> tách shared helper/hook.
- Logic chỉ dùng 1 nơi -> để local trong feature để tránh trừu tượng hóa sớm.
- Không trích xuất utility chung chỉ vì thấy file dài.

## 5.6. Rule 06 - Tên gọi phải phản ánh đúng domain và cấp độ tái sử dụng

- Shared primitive: `Button`, `TextField`, `DataTable`
- Business component: `ExamSubmissionButton`, `StudentScoreTable`
- Hook: `useOmrScanner`, `useStudentFilters`
- Helper thuần: `formatScore`, `buildPaginationRange`

Tránh dùng tên mơ hồ như `Helper`, `Manager`, `Common`, `Thing`, `Wrapper2`.

## 5.7. Rule 07 - Không hard-code style khi đã có semantic variant

Ví dụ đúng:

```tsx
<Button variant="danger" size="md" />
```

Ví dụ sai:

```tsx
<button className="bg-red-500 px-4 py-2 rounded-lg text-white">Xóa</button>
```

Nếu cần style mới lặp lại nhiều lần, phải mở rộng variant/token, không copy class thủ công.

## 5.8. Rule 08 - Một hành vi, một API thống nhất

Ví dụ:

- Loading của button luôn là `isLoading`
- Disabled luôn là `disabled` hoặc `isDisabled` theo chuẩn đã chọn
- Error của input luôn là `error`
- Hint phụ trợ luôn là `hint` hoặc `helperText` theo chuẩn toàn repo

Không được để cùng một meaning nhưng nhiều prop name khác nhau.

## 5.9. Rule 09 - Responsive phải nhất quán theo design system

- Mobile-first là mặc định.
- Touch target trên mobile tối thiểu `44px`.
- Body text mobile tối thiểu `16px`.
- Layout phải dùng grid/spacing nhất quán với Bento logic.
- Không chèn breakpoint tùy hứng nếu chưa chứng minh cần thiết.

## 5.10. Rule 10 - Accessibility là một phần của contract, không phải phần thêm vào sau

Mỗi component interactive bắt buộc phải có:

- keyboard access;
- focus-visible rõ ràng;
- aria label hoặc native semantics phù hợp;
- text/error/helper hỗ trợ đọc hiểu;
- icon-only button có accessible name;
- trạng thái selected/error/success không chỉ truyền bằng màu;
- reduced motion được tôn trọng khi animation đáng kể.

## 5.11. Rule 11 - Copy phải đồng nhất về giọng văn

Mọi microcopy sinh bởi AI agent phải tuân thủ:

- rõ ràng;
- ngắn gọn;
- tích cực;
- chuyên nghiệp nhưng gần gũi;
- không pha trò ở context nghiêm túc như chấm điểm, thi cử, lỗi hệ thống.

## 5.12. Rule 12 - Khi thêm mới, phải chứng minh vì sao không dùng lại cái cũ

Bất kỳ component/module mới nào cũng phải trả lời được 3 câu hỏi:

1. Vấn đề thực tế là gì?
2. Vì sao component hiện có không giải quyết được?
3. Vì sao không thể mở rộng bằng variant/slot?

Nếu không trả lời rõ, không được tạo mới.

---

## 6. Mapping thay đổi -> phần bắt buộc phải đồng bộ

| Khi thay đổi              | Phải cập nhật đồng thời                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| CSS color token           | CSS variables, Tailwind theme, docs token, component reference, contrast check |
| Font/typography scale     | Tailwind theme, docs typography, heading usage, responsive review              |
| Motion/easing             | Tailwind theme, reduced-motion handling, component transitions, docs motion    |
| Shared component API      | component code, type, tests, story/demo, docs, all call sites                  |
| Shared variant mới        | variant mapping, snapshot/demo, docs, visual review, QA cases                  |
| Input validation behavior | UI state, helper/error text, aria-invalid, tests, forms docs                   |
| Data table behavior       | sort/filter/select API, sticky header, alignments, keyboard behavior, docs     |
| OMR scanner state         | state machine/UI state, motion, haptic/audio fallback, tests, docs             |
| Copy text chung           | constants, all screens reuse, docs tone guidelines                             |
| Folder/module structure   | import path, barrel exports, docs architecture                                 |

> **Quy tắc chốt:** thay đổi không hoàn tất nếu còn một lớp liên quan chưa được cập nhật.

---

## 7. Chuẩn triển khai theo từng lớp kỹ thuật

## 7.1. Styling rules

- Ưu tiên Tailwind utility theo token semantic.
- Không dùng inline style cho các giá trị có thể biểu diễn qua token/theme.
- Chỉ dùng inline style khi thật sự cần giá trị runtime động (ví dụ camera overlay, computed transform đặc biệt).
- Không gắn class trùng lặp dài dòng ở nhiều file; phải gom vào shared component hoặc helper class nếu lặp lại thực sự.
- Mọi class trạng thái phải rõ ràng, dễ truy nguyên.

## 7.2. Component rules

Mỗi shared component bắt buộc có:

- `Props` typed rõ ràng;
- variant/state được định nghĩa nhất quán;
- default behavior rõ ràng;
- forward ref nếu cần cho form/focus;
- hỗ trợ `className` hoặc slot extension có kiểm soát;
- test cho state quan trọng;
- docs usage cơ bản.

## 7.3. Hooks rules

- Hook chỉ chứa logic trạng thái/tác vụ, không chứa JSX.
- Hook không được âm thầm sửa UI contract.
- Hook shared phải độc lập feature hoặc được đặt trong feature tương ứng.
- Không tạo custom hook chỉ để bọc 2-3 dòng code nếu không tăng độ rõ ràng.

## 7.4. Types rules

- Type dùng chung nằm ở nơi dùng chung.
- Không sao chép interface giữa các file.
- Với component shared, `Props` là nguồn sự thật duy nhất cho API sử dụng.
- Enum/union cho state phải phản ánh đúng contract docs.

## 7.5. State management rules

- State local giữ local nếu không cần chia sẻ.
- Chỉ đưa lên store/global khi có nhiều consumer hoặc cần đồng bộ xuyên màn hình.
- Trạng thái UI tạm thời (hover, open, active row) không được đẩy lên global store vô cớ.

## 7.6. Service/API rules

- Tách layer API khỏi component.
- Không gọi fetch trực tiếp rải rác trong nhiều component nếu cùng một nghiệp vụ.
- Chuẩn hóa response mapping và error handling theo domain.

---

## 8. Chuẩn riêng cho 5 component cốt lõi

## 8.1. Button

AI agent phải luôn đảm bảo:

- hỗ trợ `variant`, `size`, `isLoading`, `isDisabled`, `leftIcon`, `rightIcon`;
- loading giữ nguyên chiều rộng nút;
- active state scale `0.98` nếu phù hợp môi trường;
- mobile hitbox >= `44px`;
- focus ring rõ ràng;
- không tạo button “na ná” ở feature khác.

## 8.2. Multiple Choice Option

Bắt buộc giữ:

- toàn bộ card là hitbox;
- `single` và `multiple` phải rõ control type;
- selected/correct/wrong có mapping semantic thống nhất;
- builder mode mới được có drag handle;
- không tách nhiều implementation khác nhau cho học sinh và giáo viên nếu có thể cấu hình bằng props/context.

## 8.3. Text Field

Bắt buộc giữ:

- label, placeholder, leading/trailing icon, hint/error text;
- focus border dày hơn và có ring;
- error state không chỉ đổi màu, phải có text;
- search field luôn có icon kính lúp theo contract;
- number/password/text/search là các biến thể của cùng một họ component.

## 8.4. Data Table

Bắt buộc giữ:

- sticky header cho danh sách dài;
- text căn trái, số căn phải;
- hover row có nền nhẹ;
- standard/compact/expandable là variant rõ ràng;
- sort/select/pagination không được triển khai mỗi màn hình một kiểu.

## 8.5. OMR Scanner Viewfinder

Bắt buộc giữ:

- states: searching, processing, success, error;
- searching có animation “breathe”;
- success dùng success color ngay lập tức;
- haptic/sound phải có kiểm soát, có fallback và tôn trọng quyền thiết bị/trình duyệt;
- mọi UI scanner phải ưu tiên tốc độ nhận biết trạng thái.

---

## 9. Chuẩn code style và naming

## 9.1. Tên file

- Component: `button.tsx`, `text-field.tsx`
- Hook: `use-omr-scanner.ts` hoặc `useOmrScanner.ts` theo chuẩn repo, nhưng phải nhất quán toàn cục
- Utils: `format-score.ts`
- Constants: `grading-copy.ts`, `routes.ts`

> Chọn một chuẩn `kebab-case` hoặc `camelCase` cho tên file và dùng thống nhất toàn repo.

## 9.2. Tên prop

Phải ưu tiên semantic rõ ràng:

- `variant`
- `size`
- `status`
- `disabled`
- `isLoading`
- `error`
- `hint`
- `leftIcon`
- `rightIcon`

## 9.3. Import/export

- Hạn chế circular dependency.
- Shared component có thể dùng barrel export có kiểm soát.
- Feature module không import ngược vào `components/ui`.
- `ui` không phụ thuộc business logic.

---

## 10. Chuẩn accessibility bắt buộc

AI agent chỉ được xem một UI task là hoàn tất nếu đáp ứng tối thiểu:

- contrast đạt baseline AA theo EDS;
- keyboard navigation dùng được;
- focus-visible không bị mất;
- input có label rõ ràng;
- error message đọc hiểu được;
- icon-only button có accessible name;
- trạng thái selected/error/success không chỉ truyền bằng màu;
- reduced motion được tôn trọng khi animation đáng kể.

---

## 11. Chuẩn test để tránh code rời rạc

## 11.1. Bắt buộc test theo contract

Mỗi shared component nên có test cho:

- render mặc định;
- variant chính;
- state focus/disabled/loading/error;
- keyboard interaction quan trọng;
- aria/semantics cơ bản.

## 11.2. Ưu tiên test hành vi hơn test implementation

- Test “người dùng thấy gì/làm gì được”;
- Tránh test vào chi tiết class nội bộ trừ khi class chính là contract bắt buộc;
- Chỉ snapshot khi thật sự có giá trị bảo vệ contract UI.

## 11.3. Visual regression khi có shared UI lớn

Áp dụng cho:

- Button variants
- Input states
- Data table density
- OMR viewfinder states
- Dark mode / light mode contrast

---

## 12. Chuẩn tài liệu hóa để AI agent luôn cập nhật đồng bộ

Mỗi khi AI agent thay đổi shared UI hoặc rule quan trọng, phải cập nhật tối thiểu một trong các nơi sau tùy phạm vi:

- `docs/design-system/*`
- `docs/architecture/*`
- `docs/conventions/*`
- `docs/ai-agent/*`
- Story/demo examples

### 12.1. Thành phần docs tối thiểu cho shared component

Mỗi shared component nên có:

- mục đích sử dụng;
- khi nào dùng / khi nào không dùng;
- props;
- variants;
- states;
- accessibility notes;
- ví dụ code ngắn.

### 12.2. Quy tắc không để docs chết

Nếu code thay đổi nhưng docs chưa đổi, thay đổi đó được xem là **chưa hoàn tất**.

---

## 13. Definition of Done cho AI agent

Một task chỉ được coi là hoàn thành khi thỏa mãn toàn bộ:

1. đúng yêu cầu nghiệp vụ;
2. không phá vỡ EDS v3.0;
3. không tạo thêm pattern UI trùng lặp;
4. token/variant/state được dùng đúng nguồn sự thật;
5. responsive hợp lệ, touch target đúng chuẩn;
6. accessibility hợp lệ ở mức tối thiểu;
7. code được đặt đúng layer kiến trúc;
8. types/tests/docs liên quan đã được cập nhật;
9. không còn hard-code lặp lại đáng lẽ phải gom về shared layer;
10. tên gọi, import path, cấu trúc thư mục nhất quán với toàn repo.

---

## 14. Checklist PR/Review cho AI agent

Dùng checklist này cho mọi thay đổi do AI agent tạo ra.

### 14.1. Design compliance

- [ ] Không làm lệch EDS v3.0
- [ ] Dùng đúng token màu/typography/motion
- [ ] Dùng Lucide nếu có icon
- [ ] Touch target mobile >= 44px
- [ ] Body text mobile >= 16px
- [ ] Responsive theo Bento logic

### 14.2. Architecture compliance

- [ ] Đặt file đúng layer
- [ ] Không tạo component trùng nghĩa
- [ ] Không duplicate type/logic/style
- [ ] Shared logic được trích xuất hợp lý, không quá tay

### 14.3. Component compliance

- [ ] Đủ state quan trọng
- [ ] API props nhất quán
- [ ] Focus/hover/disabled/loading/error hoạt động đúng
- [ ] Accessibility không bị bỏ sót

### 14.4. Synchronization compliance

- [ ] Đã cập nhật type/interface liên quan
- [ ] Đã cập nhật docs/story/demo liên quan
- [ ] Đã cập nhật tests liên quan
- [ ] Đã rà soát call sites bị ảnh hưởng

---

## 15. Prompt vận hành ngắn cho AI agent

Có thể đặt đoạn sau ở `AGENTS.md`, `CLAUDE.md`, `Cursor Rules` hoặc `Copilot Instructions`:

> Bạn là AI coding agent của project Examxy.  
> Mọi thay đổi phải tuân thủ EDS v3.0 và AI Agent Project Guide.  
> Không được tự ý tái định nghĩa design language.  
> Luôn audit component/tokens/docs/tests hiện có trước khi viết code.  
> Ưu tiên tái sử dụng pattern hiện có, sau đó mới mở rộng bằng variant/slot; chỉ tạo mới khi đã chứng minh không thể dùng lại.  
> Không hard-code màu, spacing, typography, motion nếu token/theme đã tồn tại.  
> Mọi thay đổi shared UI phải cập nhật đồng bộ code, types, tests, docs và usage sites.  
> Mọi interactive UI phải đạt keyboard access, focus-visible, semantic labeling và mobile touch target tối thiểu 44px.  
> Nếu phát hiện xung đột giữa code hiện tại và EDS, ưu tiên EDS và đề xuất refactor hợp nhất.

---

## 16. Kế hoạch áp dụng vào repo hiện tại

## Giai đoạn 1 - Chuẩn hóa nền tảng

- chốt vị trí file token/theme chuẩn;
- gom các shared primitive về `components/ui`;
- chuẩn hóa prop naming;
- viết docs ngắn cho 5 component cốt lõi.

## Giai đoạn 2 - Đồng bộ feature layer

- thay thế implementation trùng lặp bằng shared component;
- tách business UI vào `features/*`;
- gom copy, types, validation vào nơi chuẩn.

## Giai đoạn 3 - Thiết lập hàng rào chất lượng

- thêm lint/checklist review;
- thêm tests contract cho component shared;
- thêm visual review cho state quan trọng;
- bắt buộc update docs khi thay đổi shared layer.

---

## 17. Kết luận

Tài liệu này không tạo ra một design system mới, mà biến EDS v3.0 thành **hệ điều hành thống nhất cho codebase**.  
Khi AI agent tuân thủ đúng các rule tại đây, project sẽ đạt được 4 lợi ích cốt lõi:

1. **ít trùng lặp hơn**;
2. **dễ mở rộng hơn**;
3. **UI/UX nhất quán hơn**;
4. **mọi thay đổi đều có hệ thống, không rời rạc**.
