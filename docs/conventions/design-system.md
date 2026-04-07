# EXAMXY DESIGN SYSTEM (EDS) v2.3 — TAILWIND, RESPONSIVE, COMPONENTS & GUIDELINES

## 1. 🎯 TẦM NHÌN & NGUYÊN TẮC (2026 VISION)
Examxy Design System (EDS) v2.3 rũ bỏ phong cách "Tối giản" đơn thuần để chuyển sang Tối giản Chức năng (Functional Minimalism) kết hợp chặt chẽ với Tailwind CSS.
- **Thẩm mỹ định hướng dữ liệu**: Sử dụng lưới Bento (Bento Grids) linh hoạt, tự động xếp chồng (stack) trên Mobile và dàn trải trên Desktop.
- **Công thái học thị giác & Responsive**: Giao diện có chiều sâu, hỗ trợ vùng chạm (touch target) thân thiện với ngón tay trên màn hình cảm ứng.
- **Tiếp cận toàn diện**: Hỗ trợ Tailwind `dark: mode` tự động và tuân thủ chuẩn WCAG 2.2 về độ tương phản.

## 2. 🎨 CHI TIẾT TRIỂN KHAI: COLOR (OKLCH & TAILWIND)
Hệ thống sử dụng OKLCH thay cho HEX/HSL để đảm bảo độ sáng (Lightness) đồng đều, hỗ trợ thay đổi Light/Dark mode mượt mà mà không làm mất độ tương phản. Chúng ta thiết lập các biến CSS cục bộ và kế thừa chúng trong cấu hình Tailwind.

### 2.1. Thiết lập CSS Variables (Global)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brand Primary - Trust Blue */
    --color-primary-500: 0.45 0.26 264; 
    --color-primary-600: 0.40 0.26 264; /* Hover state */
    --color-primary-100: 0.95 0.03 264; /* Soft background */

    /* Semantic Colors */
    --color-success: 0.65 0.15 146; /* OMR Scan Success */
    --color-error: 0.55 0.20 29;
    --color-warning: 0.75 0.15 80;

    /* Surfaces & Neutrals */
    --color-bg-app: 0.98 0.01 264;
    --color-bg-surface: 1 0 0;
    --color-text-main: 0.2 0.02 264;
    --color-border: 0.9 0.02 264;
  }

  .dark {
    --color-bg-app: 0.15 0.01 264;
    --color-bg-surface: 0.2 0.02 264;
    --color-text-main: 0.95 0.01 264;
    --color-border: 0.3 0.02 264;
  }
}
```

### 2.2. Tailwind Configuration (tailwind.config.js)
Sử dụng hàm `oklch()` bọc ngoài các biến CSS để Tailwind có thể nội suy độ trong suốt (opacity).
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          100: 'oklch(var(--color-primary-100) / <alpha-value>)',
          500: 'oklch(var(--color-primary-500) / <alpha-value>)',
          600: 'oklch(var(--color-primary-600) / <alpha-value>)',
        },
        success: 'oklch(var(--color-success) / <alpha-value>)',
        error: 'oklch(var(--color-error) / <alpha-value>)',
        warning: 'oklch(var(--color-warning) / <alpha-value>)',
        background: {
          app: 'oklch(var(--color-bg-app) / <alpha-value>)',
          surface: 'oklch(var(--color-bg-surface) / <alpha-value>)',
        },
        content: {
          main: 'oklch(var(--color-text-main) / <alpha-value>)',
        },
        border: 'oklch(var(--color-border) / <alpha-value>)',
      }
    }
  }
}
```

## 3. 🔤 CHI TIẾT TRIỂN KHAI: TYPOGRAPHY & FLUID SCALING
Sử dụng font Geist Sans và Geist Mono. Responsive Typography sẽ tự động co giãn kích thước (Fluid Typography) tùy theo viewport, đảm bảo hiển thị đẹp trên điện thoại mà không cần khai báo quá nhiều điểm ngắt (breakpoints).

### 3.1. Nguyên tắc Responsive Typography
- **Quy tắc bất biến**: Kích thước văn bản nội dung (Body text) không bao giờ được nhỏ hơn 16px trên các thiết bị di động để duy trì khả năng đọc.
- **Sử dụng Clamp**: Thiết lập font size linh hoạt từ Mobile (320px) đến Desktop (1280px).

### 3.2. Cấu hình Tailwind cho Typography
```javascript
// tailwind.config.js bổ sung
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        // Fluid typography sử dụng CSS clamp()
        'h1': 'clamp(1.75rem, 1.35rem + 2vw, 2.5rem)',   /* 28px - 40px */
        'h2': 'clamp(1.375rem, 1.175rem + 1vw, 1.875rem)', /* 22px - 30px */
        'h3': 'clamp(1.125rem, 1.025rem + 0.5vw, 1.25rem)',/* 18px - 20px */
        'body': '1rem',                                   /* Cố định 16px */
        'sm': '0.875rem',                                 /* 14px */
      }
    }
  }
}
```

## 4. 📏 CHI TIẾT TRIỂN KHAI: SPACING, SHAPE & RESPONSIVE LAYOUT
Hệ thống sử dụng các tiện ích khoảng cách mặc định của Tailwind với cấu trúc lưới Bento Grid. Thiết kế chú trọng vào độ bo góc vừa phải theo phong cách Tối giản chức năng (Functional Minimalism), tuyệt đối không lạm dụng bo tròn quá đà.

### 4.1. Quy tắc Shape & Border Radius
- **Panel & Section lớn**: Rút kinh nghiệm từ trang Auth, **không sử dụng** các góc bo quá tròn (vd `rounded-[2.5rem]`, `3rem`+). Mọi Panel hoặc CardShell bắt buộc dùng token quy chuẩn là `--radius-panel` (tương đương `1.75rem`/`28px` hoặc class `rounded-[var(--radius-panel)]`).
- **Auth Edge-to-Edge**: Đối với các trang Xác thực (Login, Register...), sử dụng bố cục tràn viền (Edge-to-Edge) với ảnh hero chiếm trọn một bên (Desktop: bên trái, Mobile: phía trên) kết hợp với mask mờ (gradient fade) để tạo sự kết nối liền mạch với khối Form. Mọi trang Auth phải dùng chung Component `<AuthEdgeLayout />`.
- **Input & Checkbox**: Dùng token `--radius-input` (`1rem`/`16px`) cho các chi tiết nhập liệu.
- **Button**: Duy trì bo góc mềm mại nhưng không trở thành dạng viên thuốc mập mạp (pill) cho khối vuông lớn.

### 4.2. Quy tắc Responsive Hitbox (Vùng chạm)
Tất cả các thành phần tương tác (Button, Input, Checkbox) trên Mobile (kích thước màn hình < 768px) bắt buộc phải có chiều cao và chiều rộng tối thiểu là 44px (tương đương `h-11` hoặc `min-h-[44px]` trong Tailwind) để chống bấm nhầm.
```html
<button className="min-h-[44px] md:min-h-[40px] px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
  Nộp Bài
</button>
```

### 4.2. Triển khai Bento Grid bằng Tailwind
Khung quản lý của Giáo viên sẽ tự động dàn thành 1 cột trên Mobile và mở rộng ra 3-4 cột trên Tablet/Desktop.
```html
<main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8">
  
  <div className="p-6 bg-background-surface rounded-2xl border border-border shadow-sm">
    <h3 className="text-h3 font-medium mb-4">Điểm trung bình</h3>
    <p className="text-h1 font-mono font-bold text-primary-500">7.85</p>
  </div>

  <div className="md:col-span-2 p-6 bg-background-surface rounded-2xl border border-border shadow-sm">
    <h3 className="text-h3 font-medium mb-4">Phổ điểm tuần này</h3>
  </div>

</main>
```

## 5. 🔣 CHI TIẾT TRIỂN KHAI: ICONOGRAPHY
Để đảm bảo tính nhất quán và hiệu suất, hệ thống sẽ sử dụng thư viện mã nguồn mở Lucide Icons (được build sẵn dưới dạng React Components) thay vì dùng ảnh SVG rời rạc hoặc Icon Fonts.

### 5.1. Icon Design Contract
Tất cả icon tự thiết kế hoặc thêm mới phải tuân thủ nghiêm ngặt các quy tắc sau:
- **Canvas**: 24x24px
- **Stroke Width**: 2px (Cố định, không dùng fill trừ các icon báo trạng thái).
- **Corner & Cap**: Round joins và Round caps.
- **Padding**: Tối thiểu 1px padding bên trong canvas.

### 5.2. React Implementation (Lucide)
```javascript
// Cài đặt: npm install lucide-react
import { ScanLine, CheckCircle2, AlertTriangle } from 'lucide-react';

const IconWrapper = ({ icon: Icon, color = 'var(--color-text-main)', size = 24 }) => {
  return (
    <Icon 
      size={size} 
      color={color} 
      strokeWidth={2} // Đảm bảo luôn giữ stroke 2px
      className="eds-icon-transition"
    />
  );
};
```

## 6. 🎬 CHI TIẾT TRIỂN KHAI: MOTION & ANIMATION (TAILWIND EXTENSIONS)
Hoạt ảnh phải mượt mà và tôn trọng cài đặt giảm chuyển động (Reduced Motion) của người dùng để đáp ứng chuẩn trợ năng.

### 6.1. Thiết lập Custom Easings trong Tailwind
Chúng ta khai báo các đường cong chuyển động (Bezier Curves) vào Tailwind config để tái sử dụng toàn cục.
```javascript
// tailwind.config.js bổ sung
module.exports = {
  theme: {
    extend: {
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'entrance': 'cubic-bezier(0, 0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
      keyframes: {
        'scanner-breathe': {
          '0%, 100%': { transform: 'scale(1)', borderColor: 'oklch(0.65 0.15 146 / 0.4)' },
          '50%': { transform: 'scale(1.02)', borderColor: 'oklch(0.65 0.15 146 / 1)' },
        }
      },
      animation: {
        'scanner-breathe': 'scanner-breathe 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      }
    }
  }
}
```

## 7. 🧱 ĐẶC TẢ THÀNH PHẦN (COMPONENT SPECIFICATIONS)
Đây là tài liệu Contract chi tiết cho 5 Component cốt lõi của hệ thống Examxy, dùng làm nền tảng cho Frontend Developer xây dựng thư viện.

### 7.1. Button (Nút bấm)
- **Anatomy (Cấu trúc)**: Gồm 4 phần có thể tùy biến: Container (Vùng chứa), Leading Icon (Biểu tượng trái), Label (Nhãn chữ), Trailing Icon (Biểu tượng phải).
- **Variants (Biến thể)**:
  - `Primary`: Nền xanh chủ đạo, chữ trắng (Dùng cho CTA chính như "Nộp bài", "Tạo kỳ thi").
  - `Secondary`: Nền trong suốt, viền xám, chữ đen.
  - `Ghost`: Không nền, không viền (Dùng cho thao tác phụ).
  - `Danger`: Nền đỏ (Dùng khi Xóa/Hủy).
- **Properties (Thuộc tính)**: `variant`, `size (sm, md, lg)`, `isLoading`, `isDisabled`, `leftIcon`, `rightIcon`.
- **States (Trạng thái)**: Default, Hover (tối hơn 1 tone), Focused (có viền focus ring), Disabled (độ mờ 60%).
- **Behavior (Hành vi tương tác)**: 
  - Khi ở trạng thái Active/Pressed, nút bấm sẽ scale thu nhỏ lại 0.98 để tạo cảm giác nhấn vật lý. 
  - Khi `isLoading = true`, label chữ sẽ ẩn đi và hiển thị Spinner ở giữa, chiều rộng của nút (width) phải được giữ nguyên để tránh làm xô lệch bố cục.
  - **Single Line Priority**: Đối với các nút có nội dung ngắn (dưới 5 từ), luôn ưu tiên hiển thị trên một dòng duy nhất bằng cách sử dụng `whitespace-nowrap`. Điều này giúp duy trì tính chuyên nghiệp và thẩm mỹ cho giao diện, đặc biệt là trên các thiết bị di động.

### 7.2. Multiple Choice Option (Khối đáp án trắc nghiệm)
- **Anatomy**: Card Container (Thẻ chứa), Selection Control (Radio hoặc Checkbox), Item Letter (Ký tự A, B, C, D), Label Content (Nội dung đáp án).
- **Variants**:
  - `Single`: Chọn 1 đáp án (sử dụng Radio icon dạng tròn).
  - `Multiple`: Chọn nhiều đáp án (sử dụng Checkbox icon dạng vuông).
- **Properties**: `type (single/multiple)`, `letter`, `content`, `status (default, selected, correct, wrong)`.
- **States & Behavior**:
  - `Default`: Thẻ viền xám, nền trắng. Toàn bộ vùng thẻ đều có thể bấm được (Hitbox toàn phần).
  - `Selected`: Viền chuyển thành Primary, nền đổi sang Primary Soft (màu xanh nhạt).
  - `Correct/Wrong` (Sau khi chấm điểm): Nền đổi sang Xanh lá (Success) hoặc Đỏ (Error). Chữ đổi sang màu trắng.
  - `Builder Mode` (Dành cho giáo viên): Khi hover vào khối đáp án, một biểu tượng "Drag Handle" (6 dấu chấm) sẽ xuất hiện bên trái, cho phép giáo viên kéo thả để thay đổi thứ tự đáp án.

### 7.3. Text Field (Trường nhập liệu)
- **Anatomy**: Label (Tên trường), Input Container (Khối nhập liệu), Placeholder, Trailing/Leading Icon, Helper/Error Text (Văn bản phụ trợ/lỗi bên dưới).
- **Variants**: `Text`, `Password`, `Search` (Luôn có icon kính lúp bên trái), `Number` (Cho nhập điểm số).
- **Properties**: `label`, `placeholder`, `error`, `hint`, `type`.
- **States & Behavior**:
  - `Focus`: Viền đổi sang `--color-primary-500` dày 2px và hiển thị Box-shadow/Ring mờ để nhấn mạnh trường đang được nhập.
  - `Error`: Viền đổi sang `--color-error`. Nếu chuyển từ Default sang Error do người dùng nhập sai, Input sẽ có một animation "Shake" (lắc nhẹ theo phương ngang trong 300ms) kèm theo câu thông báo lỗi xuất hiện bên dưới.

### 7.4. Data Table (Bảng dữ liệu mật độ cao)
- **Anatomy**: Table Container, Header Row (Có kèm icon sắp xếp), Data Rows (Chứa Cell data), Row Checkbox (Để chọn hàng loạt), Pagination Footer (Phân trang).
- **Variants**: `Standard` (Dòng cao 48px), `Compact` (Dòng cao 32px cho màn hình nhiều dữ liệu), `Expandable` (Cho phép click để xổ ra chi tiết điểm của học sinh).
- **Properties**: `columns`, `data`, `density`, `isSelectable`, `isSortable`.
- **States & Behavior**:
  - `Scroll`: Khi cuộn dọc danh sách học sinh dài, Header Row phải tự động "Sticky" (bám dính) ở mép trên cùng.
  - `Hover`: Khi di chuột qua 1 dòng, nền dòng đó đổi màu xám nhẹ (`--color-bg-app`) để người dùng không bị lệch mắt.
  - `Alignment`: Cột chứa dữ liệu Text luôn căn trái, cột chứa Con số (Điểm, Thời gian) luôn căn phải để dễ so sánh.

### 7.5. OMR Scanner Viewfinder (Khung quét chấm bài tự động)
- **Anatomy**: Camera Feed (Nền camera), Translucent Overlay (Lớp phủ mờ che các vùng thừa), Bounding Box (Khung viền canh chỉnh), Scanning Line (Thanh quét), Feedback Toast (Thông báo trạng thái).
- **States**: `Searching` (Đang tìm tờ giấy), `Processing` (Đang phân tích AI), `Success` (Nhận diện thành công), `Error` (Không rõ ảnh).
- **Behavior**:
  - `Searching`: Bounding Box có viền nét đứt và thực hiện animation "Thở" (phóng to/thu nhỏ nhẹ từ scale 1 đến 1.02) để tạo cảm giác hệ thống đang chủ động dò tìm.
  - `Success`: Thanh quét hoàn tất, viền chuyển ngay lập tức sang màu `--color-success`. Đồng thời kích hoạt thiết bị rung nhẹ (Haptic feedback) và âm thanh "bíp" để giáo viên không cần nhìn chăm chú vào màn hình.

## 8. 📚 TÀI LIỆU HƯỚNG DẪN & QUY TRÌNH (GUIDELINES & DOCUMENTATION)
Để đảm bảo Design System duy trì được tính nhất quán và dễ dàng mở rộng, toàn bộ team (Designers, Developers, PMs) cần tuân thủ các hướng dẫn chuẩn mực dưới đây.

### 8.1. Hướng Dẫn Trợ Năng (Accessibility Guidelines - WCAG 2.2)
Hệ thống Examxy được xây dựng để đảm bảo cơ hội tiếp cận công bằng cho mọi đối tượng học sinh và giáo viên.
- **Chuyển dịch trọng tâm**: Không chỉ đánh giá trên cấp độ toàn trang (page-level), chúng ta chú trọng vào khả năng truy cập ở cấp độ tương tác (interaction-level).
- **Nguyên tắc P.O.U.R**: Mọi UI Components phải tuân thủ 4 nguyên tắc: Dễ nhận biết (Perceivable), Dễ thao tác (Operable), Dễ hiểu (Understandable), và Mạnh mẽ/Tương thích cao (Robust).
- **Độ tương phản màu sắc (Contrast Ratios)**:
  - Văn bản thường: Phải đạt tỷ lệ tương phản tối thiểu 4.5:1 so với màu nền (Chuẩn AA).
  - Văn bản lớn & Icon/Thành phần UI: Phải đạt tỷ lệ tương phản tối thiểu 3:1 so với nền.
- **Lưu ý**: Không sử dụng màu sắc làm phương thức duy nhất để truyền đạt thông tin (ví dụ: lỗi input phải có viền đỏ và kèm theo text giải thích lỗi dưới chân).

### 8.2. Giọng Văn & Viết Copy (Tone of Voice & Copywriting)
Cách hệ thống "trò chuyện" với người dùng cũng quan trọng như giao diện của nó.
- **Chuyên nghiệp nhưng gần gũi**: Sử dụng ngôn từ rõ ràng, ngắn gọn và tránh lạm dụng thuật ngữ công nghệ phức tạp. Giọng văn cần mang tính khích lệ, trao quyền cho giáo viên và học sinh.
- **Cấu trúc câu tích cực**: Tránh các câu mang nghĩa phủ định nặng nề (ví dụ: thay vì viết "Đừng quên lưu bài thi", hãy viết "Hãy lưu bài thi của bạn").
- **Tập trung vào lợi ích**: Khi giới thiệu tính năng mới trên màn hình Dashboard, luôn nhấn mạnh vào giá trị nó mang lại thay vì chỉ mô tả chức năng khô khan.
- **Cá tính thương hiệu**: Loại bỏ sự cứng nhắc quá mức của phần mềm truyền thống. Xây dựng một cá tính thương hiệu rõ ràng để tạo sự khác biệt, nhưng tuyệt đối không "cố tỏ ra hài hước" ở những bối cảnh cần sự nghiêm túc như khi chấm điểm hay thi cử.

### 8.3. Quy Trình Đóng Góp (Contribution Process)
Design System là một thực thể sống. Khi một Developer hoặc Designer muốn bổ sung Component mới vào EDS, cần tuân thủ quy trình 3 bước sau để tránh việc hệ thống bị "phình to" không cần thiết:
- **Bước 1: Xác định Vấn đề (Problem Framing)**: Bắt đầu bằng một nhu cầu thực tế thay vì đi thẳng vào giải pháp. Thay vì nói "Chúng ta cần một bảng thông báo màu đỏ", hãy nói "Chúng ta cần một cách để hiển thị các thông báo lỗi nghiêm trọng đòi hỏi sự chú ý ngay lập tức".
- **Bước 2: Rà soát Hệ thống (System Audit)**: Kiểm tra xem có component nào hiện có thể giải quyết vấn đề này không. Liệu chúng ta có thể sử dụng Variants hoặc thêm các Slots vào component cũ thay vì tạo mới hoàn toàn?. Tính đa năng (Versatile) là yếu tố tiên quyết để một component được duyệt.
- **Bước 3: Đề xuất (Proposal & PR)**: Mở một Issue hoặc Merge Request. Đề xuất phải bao gồm:
  - Tuyên bố vấn đề đang giải quyết.
  - Tài liệu phân tích các phương án đã thử nghiệm.
  - Mức độ cần hỗ trợ (Ví dụ: Tự triển khai, hoặc Cần Design System team review).
- Một component chuẩn (Compliant component) bắt buộc phải có đủ documentation, states, và code mẫu.
