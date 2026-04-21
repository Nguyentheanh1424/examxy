# EXAMXY DESIGN SYSTEM (EDS) v3.0
### Tài liệu thiết kế hệ thống toàn diện — Cập nhật từ v2.3

## Purpose
Source of truth for Examxy shared UI rules: design tokens, shared primitives, accessibility baselines, motion rules, layout systems, form patterns, and component contracts.

## Applies when
- You change shared tokens, shared UI primitives, layout contracts, validation patterns, motion, or interaction behavior.
- You add or extend a shared component or any feature UI that should reuse the design system.
- You are deciding whether a frontend change belongs in tokens, shared UI, or feature-local UI.

## Current behavior / flow
- EDS v3.0 is the canonical design-system specification for Examxy frontend work.
- Token source of truth in code remains `examxy.client/src/styles/tokens.css` and `examxy.client/src/index.css`.
- Shared reusable primitives remain under `examxy.client/src/components/ui/*`.
- `AI_AGENT_PROJECT_GUIDE.md` governs how agents must implement against this design-system contract.
- Detailed specifications continue below in this document.

## Invariants
- Do not create a parallel design system or ad-hoc styling when shared tokens and shared primitives already exist.
- Preserve mobile touch targets of at least 44px, body text of at least 16px on mobile, Lucide-only icons, reduced motion handling, and non-color-only status signals.
- Reuse canonical shared components before creating new ones.
- Shared UI contract changes must update code, tests, docs, and usage sites together.

## Change checklist
- Token or shared UI contract change -> update code, usage sites, tests, and the affected frontend docs.
- Governance change -> update `AI_AGENT_PROJECT_GUIDE.md`.
- New canonical shared UI concept -> update the closest frontend `AGENTS.md` and `docs/conventions/frontend-source-of-truth.md` if routing changes.

## Related
- `docs/conventions/frontend-source-of-truth.md`
- `AI_AGENT_PROJECT_GUIDE.md`
- `examxy.client/src/styles/tokens.css`
- `examxy.client/src/index.css`
- `examxy.client/src/components/ui/*`

> **Changelog v3.0**: Bổ sung Spacing Scale, Z-index Layer System, Form Validation Pattern, Empty State, Skeleton Loader, Toast System, Color Token đầy đủ, Reduced Motion implementation, AuthEdgeLayout spec, Dark Mode per-component, Bento Grid height rules, và 8 component mới.

---

## MỤC LỤC

1. [Tầm nhìn & Nguyên tắc](#1-tầm-nhìn--nguyên-tắc)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing Scale](#4-spacing-scale)
5. [Shape & Border Radius](#5-shape--border-radius)
6. [Z-index Layer System](#6-z-index-layer-system)
7. [Responsive Layout & Breakpoints](#7-responsive-layout--breakpoints)
8. [Bento Grid](#8-bento-grid)
9. [Iconography](#9-iconography)
10. [Motion & Animation](#10-motion--animation)
11. [Component Specifications](#11-component-specifications)
12. [Form Validation Pattern](#12-form-validation-pattern)
13. [Dark Mode Per-Component](#13-dark-mode-per-component)
14. [Accessibility Guidelines](#14-accessibility-guidelines)
15. [Tone of Voice & Copywriting](#15-tone-of-voice--copywriting)
16. [Contribution Process](#16-contribution-process)

---

## 1. Tầm Nhìn & Nguyên Tắc

EDS v3.0 tiếp tục triết lý **Functional Minimalism** (Tối giản Chức năng) từ v2.3, bổ sung thêm tính **Predictability** (Tính dự đoán được) — mọi developer và designer đọc tài liệu này đều phải có câu trả lời dứt khoát cho mọi tình huống UI, không cần phải đoán mò.

### Ba Trụ Cột Thiết Kế

| Trụ cột | Ý nghĩa | Biểu hiện trong UI |
|---|---|---|
| **Clarity** | Rõ ràng, không mơ hồ | Hierarchy rõ, copy súc tích, không lạm dụng màu |
| **Efficiency** | Đạt mục tiêu nhanh nhất | Touch target đủ lớn, flow tối giản, feedback tức thì |
| **Trust** | Hệ thống đáng tin cậy | Error states rõ ràng, trạng thái loading trung thực |

---

## 2. Color System

### 2.1. CSS Variables (Global)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Brand Primary ── */
    --color-primary-50:  0.97 0.02 264;
    --color-primary-100: 0.95 0.03 264;
    --color-primary-200: 0.88 0.06 264;
    --color-primary-300: 0.75 0.12 264;
    --color-primary-400: 0.60 0.20 264;
    --color-primary-500: 0.45 0.26 264;
    --color-primary-600: 0.40 0.26 264;
    --color-primary-700: 0.34 0.24 264;

    /* ── Semantic ── */
    --color-success:         0.65 0.15 146;
    --color-success-soft:    0.93 0.05 146;
    --color-error:           0.55 0.20 29;
    --color-error-soft:      0.95 0.05 29;
    --color-warning:         0.75 0.15 80;
    --color-warning-soft:    0.97 0.04 80;
    --color-info:            0.60 0.15 230;
    --color-info-soft:       0.95 0.03 230;

    /* ── Interactive States ── */
    --color-focus-ring:      0.45 0.26 264;
    --color-disabled-bg:     0.92 0.01 264;
    --color-disabled-text:   0.65 0.02 264;
    --color-disabled-border: 0.85 0.01 264;

    /* ── Surfaces & Neutrals ── */
    --color-bg-app:          0.98 0.01 264;
    --color-bg-surface:      1.00 0.00 0;
    --color-bg-elevated:     0.99 0.005 264;
    --color-text-main:       0.20 0.02 264;
    --color-text-sub:        0.50 0.02 264;
    --color-text-disabled:   0.65 0.02 264;
    --color-border:          0.90 0.02 264;
    --color-border-strong:   0.75 0.03 264;

    /* ── Overlay ── */
    --color-overlay:         0.10 0.02 264;
  }

  .dark {
    --color-primary-50:      0.18 0.03 264;
    --color-primary-100:     0.22 0.05 264;
    --color-bg-app:          0.13 0.01 264;
    --color-bg-surface:      0.18 0.02 264;
    --color-bg-elevated:     0.22 0.02 264;
    --color-text-main:       0.95 0.01 264;
    --color-text-sub:        0.65 0.02 264;
    --color-border:          0.28 0.02 264;
    --color-border-strong:   0.45 0.03 264;
    --color-disabled-bg:     0.25 0.01 264;
    --color-overlay:         0.05 0.01 264;
  }
}
```

### 2.2. Tailwind Configuration

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'oklch(var(--color-primary-50) / <alpha-value>)',
          100: 'oklch(var(--color-primary-100) / <alpha-value>)',
          200: 'oklch(var(--color-primary-200) / <alpha-value>)',
          300: 'oklch(var(--color-primary-300) / <alpha-value>)',
          400: 'oklch(var(--color-primary-400) / <alpha-value>)',
          500: 'oklch(var(--color-primary-500) / <alpha-value>)',
          600: 'oklch(var(--color-primary-600) / <alpha-value>)',
          700: 'oklch(var(--color-primary-700) / <alpha-value>)',
        },
        success: 'oklch(var(--color-success) / <alpha-value>)',
        'success-soft': 'oklch(var(--color-success-soft) / <alpha-value>)',
        error: 'oklch(var(--color-error) / <alpha-value>)',
        'error-soft': 'oklch(var(--color-error-soft) / <alpha-value>)',
        warning: 'oklch(var(--color-warning) / <alpha-value>)',
        'warning-soft': 'oklch(var(--color-warning-soft) / <alpha-value>)',
        info: 'oklch(var(--color-info) / <alpha-value>)',
        'info-soft': 'oklch(var(--color-info-soft) / <alpha-value>)',
        background: {
          app: 'oklch(var(--color-bg-app) / <alpha-value>)',
          surface: 'oklch(var(--color-bg-surface) / <alpha-value>)',
          elevated: 'oklch(var(--color-bg-elevated) / <alpha-value>)',
        },
        content: {
          main: 'oklch(var(--color-text-main) / <alpha-value>)',
          sub: 'oklch(var(--color-text-sub) / <alpha-value>)',
          disabled: 'oklch(var(--color-text-disabled) / <alpha-value>)',
        },
        border: 'oklch(var(--color-border) / <alpha-value>)',
        'border-strong': 'oklch(var(--color-border-strong) / <alpha-value>)',
      }
    }
  }
}
```

### 2.3. Quy Tắc Sử Dụng Màu

| Tình huống | Token đúng | Token SAI |
|---|---|---|
| Nút CTA chính | `primary-500` | Hardcode `#4F46E5` |
| Text thứ cấp, placeholder | `content.sub` | `text-gray-400` |
| Input đang focus | `border-strong` + `focus-ring` | `border-blue-500` |
| Trạng thái disabled | `disabled-bg`, `disabled-text` | `opacity-50` tùy ý |
| Card nổi, dropdown | `background.elevated` | `background.surface` |

> ⚠️ **Quy tắc bất biến**: Không bao giờ sử dụng màu sắc là phương thức DUY NHẤT để truyền thông tin. Mọi error phải có icon + text kèm theo màu đỏ.

---

## 3. Typography

### 3.1. Font Stack

```javascript
fontFamily: {
  sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
}
```

### 3.2. Type Scale (Fluid)

```javascript
fontSize: {
  'display': ['clamp(2rem, 1.5rem + 2.5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'h1':      ['clamp(1.75rem, 1.35rem + 2vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
  'h2':      ['clamp(1.375rem, 1.175rem + 1vw, 1.875rem)', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
  'h3':      ['clamp(1.125rem, 1.025rem + 0.5vw, 1.25rem)', { lineHeight: '1.4' }],
  'body':    ['1rem', { lineHeight: '1.6' }],
  'sm':      ['0.875rem', { lineHeight: '1.5' }],
  'xs':      ['0.75rem', { lineHeight: '1.4' }],
  'label':   ['0.75rem', { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '600' }],
  'mono-sm': ['0.8125rem', { lineHeight: '1.5' }],
}
```

### 3.3. Quy Tắc Typography

- **Body text tối thiểu 16px** trên mọi thiết bị di động.
- **`text-xs` (12px)** chỉ dùng cho: nhãn phụ trong bảng, timestamp, badge count.
- **Font mono** dùng cho: điểm số, mã học sinh, timestamps, số liệu thống kê.
- **Không mix quá 2 font weight** trong cùng một card.

---

## 4. Spacing Scale

> ⭐ **Mới trong v3.0** — Định nghĩa rõ ràng để toàn team dùng nhất quán.

### 4.1. Token Spacing

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

### 4.2. Tailwind Mapping

```javascript
spacing: {
  '1':  '4px',
  '2':  '8px',
  '3':  '12px',
  '4':  '16px',
  '5':  '20px',
  '6':  '24px',
  '8':  '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
}
```

### 4.3. Quy Tắc Sử Dụng Spacing

| Bối cảnh | Token | Tailwind |
|---|---|---|
| Gap trong inline (icon ↔ label) | `--space-2` | `gap-2` |
| Padding button `sm` | `--space-3` ngang, `--space-2` dọc | `px-3 py-2` |
| Padding button `md` | `--space-5` ngang, `--space-3` dọc | `px-5 py-3` |
| Padding button `lg` | `--space-6` ngang, `--space-4` dọc | `px-6 py-4` |
| Padding bên trong card | `--space-6` | `p-6` |
| Gap giữa các card trong grid | `--space-4` (mobile) / `--space-6` (desktop) | `gap-4 md:gap-6` |
| Khoảng cách giữa label và input | `--space-2` | `mb-2` |
| Khoảng cách giữa input và helper text | `--space-1` | `mt-1` |
| Khoảng cách giữa các section | `--space-8` | `mb-8` |

---

## 5. Shape & Border Radius

### 5.1. Token Radius

```css
:root {
  --radius-xs:    4px;
  --radius-sm:    8px;
  --radius-input: 12px;
  --radius-md:    16px;
  --radius-panel: 20px;
  --radius-full:  9999px;
}
```

### 5.2. Quy Tắc Bắt Buộc

- **Panel & Card lớn**: Bắt buộc dùng `--radius-panel` (20px). Không dùng `rounded-3xl` (24px) hay `rounded-[2rem]`+.
- **Input & Select**: Dùng `--radius-input` (12px).
- **Button**: Dùng `--radius-md` (16px) cho md/lg. Không biến thành pill trên nút rộng.
- **Auth layout**: Edge-to-edge trên mobile (xem AuthEdgeLayout).

---

## 6. Z-index Layer System

> ⭐ **Mới trong v3.0** — Ngăn tình trạng `z-[9999]` loạn xạ.

### 6.1. Layer Stack

```css
:root {
  --z-base:      0;
  --z-raised:    10;
  --z-sticky:    100;
  --z-dropdown:  200;
  --z-overlay:   300;
  --z-modal:     400;
  --z-toast:     500;
  --z-tooltip:   600;
}
```

### 6.2. Tailwind Mapping

```javascript
zIndex: {
  'base': '0',
  'raised': '10',
  'sticky': '100',
  'dropdown': '200',
  'overlay': '300',
  'modal': '400',
  'toast': '500',
  'tooltip': '600',
}
```

### 6.3. Quy Tắc

- Không tự ý dùng số `z-index` ngoài bảng trên. Nếu cần layer mới -> mở issue.
- Mỗi loại element chỉ thuộc đúng một layer. Tooltip không thể ở `z-modal`.
- Backdrop của Modal phải ở `z-overlay`, content Modal ở `z-modal`.

---

## 7. Responsive Layout & Breakpoints

### 7.1. Breakpoint Definitions

```javascript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### 7.2. Layout Rules theo Breakpoint

| Breakpoint | Grid | Sidebar | Navigation |
|---|---|---|---|
| < `sm` (< 640px) | 1 cột | Ẩn, dùng Bottom Nav | Bottom Navigation Bar |
| `sm` – `md` | 1–2 cột | Drawer (slide từ trái) | Top bar + Hamburger |
| `md` – `lg` | 2–3 cột | Drawer hoặc collapsed | Top bar đủ |
| ≥ `lg` | 3–4 cột | Sidebar cố định 240px | Top bar + Sidebar |

### 7.3. Touch Target (Hitbox) Rules

- **Tất cả interactive elements** trên `< md`: tối thiểu `44 × 44px`.
- **Tailwind**: Dùng `min-h-[44px] md:min-h-[40px]`.
- **Không** ép buộc visual size phải 44px — có thể dùng padding ẩn để đạt kích thước này.

---

## 8. Bento Grid

### 8.1. Cấu trúc cơ bản

```html
<main class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8">
  <div class="p-6 bg-background-surface rounded-[var(--radius-panel)] border border-border shadow-sm">
    ...
  </div>

  <div class="md:col-span-2 p-6 bg-background-surface rounded-[var(--radius-panel)] border border-border shadow-sm">
    ...
  </div>
</main>
```

### 8.2. Quy Tắc Chiều Cao Card (Grid Height)

> ⭐ **Mới trong v3.0**

- **Mặc định**: Dùng `items-stretch` để các card trong cùng hàng luôn có cùng chiều cao.
- **Card metric đơn** (1 số lớn): Đặt `min-h-[160px]` để không quá mỏng.
- **Card biểu đồ**: Đặt chiều cao cố định `h-[300px] md:h-[360px]`.
- **Card danh sách**: Dùng `max-h-[400px] overflow-y-auto` để không phình vô hạn.
- **Không mix** các card có height `auto` với card có height cố định trong cùng một hàng — dễ gây layout lệch.

```html
<div class="grid grid-cols-3 gap-6 items-stretch">
  <div class="min-h-[160px] ...">Metric card</div>
  <div class="col-span-2 ...">Chart card tự căn chiều cao</div>
</div>

<div class="grid grid-cols-3 gap-6">
  <div class="col-span-3 h-[320px] ...">Full-width chart</div>
</div>
```

---

## 9. Iconography

### 9.1. Design Contract

- **Library**: Lucide Icons (React Components)
- **Canvas**: 24×24px
- **Stroke**: 2px, không dùng fill trừ icon trạng thái (success, error)
- **Corner & Cap**: Round joins + Round caps
- **Padding**: Tối thiểu 1px bên trong canvas

### 9.2. Implementation

```javascript
import { ScanLine, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const Icon = ({ icon: Ico, size = 20, className = '' }) => (
  <Ico size={size} strokeWidth={2} className={className} aria-hidden="true" />
);

const StatusIcon = ({ status }) => {
  const map = {
    success: <CheckCircle2 size={20} strokeWidth={0} fill="oklch(var(--color-success))" />,
    error: <XCircle size={20} strokeWidth={0} fill="oklch(var(--color-error))" />,
    warning: <AlertTriangle size={20} strokeWidth={2} className="text-warning" />,
    info: <Info size={20} strokeWidth={2} className="text-info" />,
  };
  return map[status] ?? null;
};
```

### 9.3. Quy Tắc

- Mọi icon trang trí phải có `aria-hidden="true"`.
- Icon mang nghĩa (không có label text kèm) phải có `aria-label`.
- Không thay đổi `strokeWidth` tùy tiện — luôn giữ `2`.

---

## 10. Motion & Animation

### 10.1. Custom Easings

```javascript
transitionTimingFunction: {
  'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'entrance': 'cubic-bezier(0, 0, 0.2, 1)',
  'exit': 'cubic-bezier(0.4, 0, 1, 1)',
  'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
},
transitionDuration: {
  'fast': '100ms',
  'normal': '200ms',
  'slow': '350ms',
  'xslow': '500ms',
},
```

### 10.2. Keyframes

```javascript
keyframes: {
  'scanner-breathe': {
    '0%, 100%': { transform: 'scale(1)', borderColor: 'oklch(0.65 0.15 146 / 0.4)' },
    '50%': { transform: 'scale(1.02)', borderColor: 'oklch(0.65 0.15 146 / 1)' },
  },
  'skeleton-shimmer': {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  'toast-in': {
    '0%': { transform: 'translateY(100%) scale(0.95)', opacity: '0' },
    '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
  },
  'toast-out': {
    '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
    '100%': { transform: 'translateY(100%) scale(0.95)', opacity: '0' },
  },
  'shake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '20%': { transform: 'translateX(-6px)' },
    '40%': { transform: 'translateX(6px)' },
    '60%': { transform: 'translateX(-4px)' },
    '80%': { transform: 'translateX(4px)' },
  },
  'fade-in': {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'slide-up': {
    '0%': { transform: 'translateY(8px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
},
animation: {
  'scanner-breathe': 'scanner-breathe 2s cubic-bezier(0.4,0,0.2,1) infinite',
  'skeleton-shimmer': 'skeleton-shimmer 1.5s linear infinite',
  'toast-in': 'toast-in 250ms cubic-bezier(0,0,0.2,1) forwards',
  'toast-out': 'toast-out 200ms cubic-bezier(0.4,0,1,1) forwards',
  'shake': 'shake 300ms cubic-bezier(0.4,0,0.2,1)',
  'fade-in': 'fade-in 200ms cubic-bezier(0,0,0.2,1)',
  'slide-up': 'slide-up 200ms cubic-bezier(0,0,0.2,1)',
},
```

### 10.3. Reduced Motion — Implementation Đầy Đủ

> ⭐ **Mới trong v3.0**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .animate-skeleton-shimmer {
    animation: none !important;
    opacity: 0.7;
  }

  .animate-scanner-breathe {
    animation: none !important;
    transform: none !important;
  }
}
```

```javascript
const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    mq.addEventListener('change', e => setPrefersReduced(e.matches));
  }, []);
  return prefersReduced;
};
```

---

## 11. Component Specifications

### 11.1. Button

**Anatomy**: `[Leading Icon] + [Label] + [Trailing Icon]` bên trong Container.

**Variants**

| Variant | Nền | Chữ | Viền | Dùng khi |
|---|---|---|---|---|
| `primary` | `primary-500` | trắng | — | CTA chính: "Nộp bài", "Tạo kỳ thi" |
| `secondary` | trong suốt | `content.main` | `border` | Hành động phụ |
| `ghost` | trong suốt | `primary-500` | — | Thao tác ít quan trọng |
| `danger` | `error` | trắng | — | Xóa, Hủy |
| `success` | `success` | trắng | — | Xác nhận hoàn thành |

**Sizes**

| Size | Height | Padding | Font size | Radius |
|---|---|---|---|---|
| `sm` | 32px | `px-3 py-1.5` | `text-sm` | `--radius-sm` |
| `md` | 40px | `px-5 py-2.5` | `text-body` | `--radius-md` |
| `lg` | 48px | `px-6 py-3` | `text-body` | `--radius-md` |

**States**

```text
Default  → Hover (primary-600) → Active/Pressed (primary-700, scale 0.98)
Focused  → outline 2px solid focus-ring, offset 2px
Disabled → disabled-bg nền, disabled-text chữ, cursor-not-allowed, không có hover
Loading  → Spinner giữa, label ẩn, width giữ nguyên (dùng min-w)
```

**Code mẫu**

```jsx
const Button = ({ variant = 'primary', size = 'md', isLoading, isDisabled, leftIcon, rightIcon, children, ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all duration-fast ease-standard active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';
  
  const variants = {
    primary:   'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-transparent text-content-main border border-border hover:bg-background-app',
    ghost:     'bg-transparent text-primary-500 hover:bg-primary-50',
    danger:    'bg-error text-white hover:opacity-90',
    success:   'bg-success text-white hover:opacity-90',
  };
  
  const sizes = {
    sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
    md: 'h-10 px-5 text-body rounded-[var(--radius-md)] min-h-[44px] md:min-h-[40px]',
    lg: 'h-12 px-6 text-body rounded-[var(--radius-md)] min-h-[44px]',
  };

  return (
    <button
      disabled={isDisabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLoading ? (
        <Spinner size={16} />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
};
```

### 11.2. Multiple Choice Option

**Anatomy**: `[Drag Handle?] + [Control] + [Letter] + [Content]`

**Properties**: `type`, `letter`, `content`, `status`, `isBuilderMode`

**States**

| Status | Background | Border | Text color |
|---|---|---|---|
| `default` | `background.surface` | `border` | `content.main` |
| `selected` | `primary-50` | `primary-500` (2px) | `content.main` |
| `correct` | `success` | `success` | white |
| `wrong` | `error` | `error` | white |
| `disabled` | `disabled-bg` | `disabled-border` | `disabled-text` |

```jsx
const MCOption = ({ type = 'single', letter, content, status = 'default', isBuilderMode }) => {
  const statusClasses = {
    default: 'bg-background-surface border-border',
    selected: 'bg-primary-50 border-primary-500 border-2',
    correct: 'bg-success border-success text-white',
    wrong: 'bg-error border-error text-white',
  };

  return (
    <div className={`group relative flex items-center gap-3 p-4 rounded-[var(--radius-md)] border cursor-pointer transition-all duration-fast min-h-[44px] ${statusClasses[status]}`}>
      {isBuilderMode && (
        <GripVertical className="absolute left-1 opacity-0 group-hover:opacity-100 transition-opacity text-content-sub" size={16} />
      )}
      {type === 'single' ? <RadioIndicator status={status} /> : <CheckboxIndicator status={status} />}
      <span className="font-mono font-semibold text-sm w-5">{letter}</span>
      <span className="flex-1 text-body">{content}</span>
    </div>
  );
};
```

### 11.3. Text Field

**Anatomy**: `[Label] → [Input Container ([Leading Icon?] + [Input] + [Trailing Icon?])] → [Helper/Error Text]`

**Variants**: `text`, `password`, `search`, `number`, `textarea`

**States**

| State | Border | Shadow | Behavior |
|---|---|---|---|
| `default` | `border` (1px) | — | — |
| `focused` | `primary-500` (2px) | `0 0 0 3px oklch(primary-500 / 0.15)` | — |
| `error` | `error` (2px) | `0 0 0 3px oklch(error / 0.15)` | Shake animation khi chuyển sang error |
| `disabled` | `disabled-border` | — | `cursor-not-allowed`, `background.app` nền |
| `success` | `success` (2px) | — | Hiện checkmark icon |

```jsx
const TextField = ({ label, placeholder, error, hint, type = 'text', leadingIcon, trailingIcon, ...props }) => {
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-label text-content-main">{label}</label>
      )}
      <div className={`flex items-center gap-2 px-3 rounded-[var(--radius-input)] border bg-background-surface transition-all duration-fast
        ${hasError
          ? 'border-error border-2 shadow-[0_0_0_3px_oklch(var(--color-error)/0.15)] animate-shake'
          : 'border-border focus-within:border-primary-500 focus-within:border-2 focus-within:shadow-[0_0_0_3px_oklch(var(--color-primary-500)/0.15)]'
        }`}>
        {leadingIcon && <span className="text-content-sub">{leadingIcon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          className="flex-1 h-11 md:h-10 bg-transparent text-body text-content-main placeholder:text-content-sub outline-none"
          {...props}
        />
        {trailingIcon && <span className="text-content-sub">{trailingIcon}</span>}
      </div>
      {(error || hint) && (
        <p className={`text-xs mt-0.5 flex items-center gap-1 ${hasError ? 'text-error' : 'text-content-sub'}`}>
          {hasError && <AlertCircle size={12} />}
          {error || hint}
        </p>
      )}
    </div>
  );
};
```

### 11.4. Data Table

**Anatomy**: `[Header (Sticky)] → [Rows] → [Pagination Footer]`

**Variants**: `standard` (48px rows), `compact` (32px rows), `expandable`

**Properties**: `columns`, `data`, `density`, `isSelectable`, `isSortable`, `isLoading`

**Behavior**
- Header tự động **sticky** khi scroll dọc (`position: sticky; top: 0; z-index: var(--z-sticky)`).
- Row hover đổi nền sang `background.app`.
- Text column -> căn **trái**. Number/Score column -> căn **phải** (`font-mono`).
- Khi `isLoading = true` -> hiển thị **Skeleton rows** thay vì spinner che toàn bảng.
- Khi không có data -> hiển thị **Empty State** component (xem 11.14).

```jsx
const columns = [
  { key: 'name', label: 'Họ tên', align: 'left', sortable: true },
  { key: 'score', label: 'Điểm', align: 'right', sortable: true, render: (v) => <span className="font-mono">{v}</span> },
  { key: 'time', label: 'Thời gian', align: 'right', render: (v) => <span className="font-mono text-content-sub">{v}</span> },
  { key: 'status', label: 'Trạng thái', align: 'left', render: (v) => <Badge status={v} /> },
];
```

### 11.5. OMR Scanner Viewfinder

**States**: `searching` -> `processing` -> `success` | `error`

**Behavior theo State**

| State | Bounding Box | Feedback |
|---|---|---|
| `searching` | Nét đứt, animation `scanner-breathe` | Toast: "Đang tìm tờ giấy..." |
| `processing` | Nét liền, xanh nhạt, thanh quét chạy | Toast: "Đang phân tích..." |
| `success` | `success` color, nét liền dày | Haptic feedback + âm thanh "bíp" + Toast success |
| `error` | `error` color, rung nhẹ | Toast error + hướng dẫn thử lại |

### 11.6. Modal / Dialog

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Backdrop] → [Dialog Container ([Header] + [Body] + [Footer])]`

**Variants**: `sm` (480px), `md` (640px), `lg` (800px), `fullscreen`

**Properties**: `title`, `description`, `size`, `isOpen`, `onClose`, `isDismissable`

**Behavior**
- Backdrop: `background.overlay` tại 60% opacity, blur `4px`.
- Mở: Backdrop fade in (200ms) + Dialog slide-up + fade-in (250ms, `ease-entrance`).
- Đóng: Dialog fade-out (150ms, `ease-exit`) + Backdrop fade out.
- Khi mở: `body { overflow: hidden }` để ngăn scroll nền.
- Focus trap: Tab chỉ đi trong modal khi đang mở.
- Đóng bằng: Nút ✕, click backdrop (nếu `isDismissable`), phím `Escape`.
- Z-index: Backdrop `z-overlay`, Content `z-modal`.

```jsx
const Modal = ({ title, description, size = 'md', isOpen, onClose, isDismissable = true, children, footer }) => {
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', fullscreen: 'w-screen h-screen rounded-none' };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-overlay/60 backdrop-blur-sm animate-fade-in"
        onClick={isDismissable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className={`relative w-full ${sizes[size]} bg-background-surface rounded-t-[var(--radius-panel)] sm:rounded-[var(--radius-panel)] shadow-2xl z-modal animate-slide-up`}
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div>
            <h2 id="modal-title" className="text-h3 font-semibold text-content-main">{title}</h2>
            {description && <p className="text-sm text-content-sub mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-background-app text-content-sub" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">{children}</div>
        {footer && <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  );
};
```

### 11.7. Dropdown / Select

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Trigger Button] → [Menu Panel ([Search?] + [Option List])]`

**Variants**: `select` (chọn 1), `multi-select` (chọn nhiều + checkbox), `command` (có search)

**Properties**: `options`, `value`, `onChange`, `placeholder`, `isSearchable`, `isMulti`, `isDisabled`

**Behavior**
- Menu xuất hiện ngay bên dưới trigger (hoặc lên trên nếu thiếu không gian).
- Z-index: `z-dropdown`.
- Đóng khi: click ngoài, chọn option (single), phím `Escape`.
- Tối đa hiển thị 8 options trước khi scroll.
- `isSearchable`: Hiện input search trên đầu menu.

```jsx
const DropdownOption = ({ label, value, isSelected, icon }) => (
  <div className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-body transition-colors duration-fast
    ${isSelected ? 'bg-primary-50 text-primary-500 font-medium' : 'text-content-main hover:bg-background-app'}`}>
    {icon && <span>{icon}</span>}
    <span className="flex-1">{label}</span>
    {isSelected && <Check size={16} />}
  </div>
);
```

### 11.8. Toast / Notification

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Icon] + [Content (Title + Description?)] + [Action?] + [Close?]`

**Variants**: `success`, `error`, `warning`, `info`

**Properties**: `variant`, `title`, `description`, `duration`, `action`, `isDismissable`

**Behavior**
- **Vị trí**: Bottom-center trên mobile, Bottom-right trên desktop. `z-toast`.
- **Duration**: Mặc định `4000ms`. Error toast không tự tắt (`duration: Infinity`) — cần người dùng bấm tắt.
- **Tối đa 3 toast cùng lúc** — toast cũ nhất tự xóa nếu có toast thứ 4.
- Animation in: `animate-toast-in`. Animation out: `animate-toast-out`.
- Stack từ dưới lên, toast mới nhất ở dưới cùng.

```javascript
const toastConfig = {
  success: { bg: 'bg-success', icon: CheckCircle2, text: 'text-white' },
  error: { bg: 'bg-error', icon: XCircle, text: 'text-white' },
  warning: { bg: 'bg-warning-soft', icon: AlertTriangle, text: 'text-content-main' },
  info: { bg: 'bg-info-soft', icon: Info, text: 'text-content-main' },
};

toast.success('Nộp bài thành công!', { description: 'Điểm sẽ được cập nhật trong 5 phút.' });
toast.error('Lỗi kết nối', { description: 'Vui lòng thử lại.', duration: Infinity });
toast.warning('Còn 5 phút', { description: 'Bài thi sắp kết thúc.' });
```

### 11.9. Badge & Tag

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Dot?] + [Label]`

**Variants**: `solid` (màu nền đậm), `soft` (màu nền nhạt), `outline` (chỉ viền)

**Colors**: `primary`, `success`, `error`, `warning`, `info`, `neutral`

**Sizes**: `sm` (height 20px, `text-xs`), `md` (height 24px, `text-sm`)

```jsx
<Badge variant="soft" color="success">Đã nộp</Badge>
<Badge variant="soft" color="warning">Chưa nộp</Badge>
<Badge variant="soft" color="error">Nộp muộn</Badge>
<Badge variant="soft" color="neutral">Vắng mặt</Badge>

<Badge variant="solid" color="error" size="sm">12</Badge>
```

```jsx
const Badge = ({ variant = 'soft', color = 'neutral', size = 'md', dot, children }) => {
  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full px-2
      ${size === 'sm' ? 'h-5 text-xs' : 'h-6 text-sm'}
      ${badgeClasses[variant][color]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};
```

### 11.10. Tabs & Navigation

> ⭐ **Mới trong v3.0**

**Variants**

| Variant | Dùng khi |
|---|---|
| `underline` | Navigation chính trong page (Dashboard, Kết quả thi...) |
| `pill` | Filter trong bảng dữ liệu, toggle view |
| `bottom-nav` | Navigation mobile cố định ở cuối màn hình |

**Bottom Navigation (Mobile)**
- Cố định `bottom: 0`, chiều cao `64px`, `z-sticky`.
- Tối đa **5 items**. Từ 4 items trở lên dùng icon + label `text-xs`.
- Active item: `primary-500` màu icon + label, indicator dot hoặc pill bên dưới.

```jsx
const Tabs = ({ tabs, activeTab, onChange, variant = 'underline' }) => {
  return (
    <div className={variant === 'underline' ? 'border-b border-border' : 'flex gap-1 p-1 bg-background-app rounded-[var(--radius-md)]'}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={variant === 'underline'
            ? `px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-fast
               ${activeTab === tab.key ? 'border-primary-500 text-primary-500' : 'border-transparent text-content-sub hover:text-content-main'}`
            : `px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-fast
               ${activeTab === tab.key ? 'bg-background-surface shadow-sm text-content-main' : 'text-content-sub hover:text-content-main'}`
          }
        >
          {tab.label}
          {tab.count !== undefined && <Badge variant="soft" color="neutral" size="sm" className="ml-1.5">{tab.count}</Badge>}
        </button>
      ))}
    </div>
  );
};
```

### 11.11. Pagination

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Prev] + [Page numbers] + [Next]` + `[Per page selector?]`

**Behavior**
- Hiển thị tối đa **7 page buttons** trước khi dùng ellipsis `...`.
- Pattern: `[1] [2] [3] [...] [8] [9] [10]` hoặc `[1] [...] [4] [5] [6] [...] [10]`.
- Trên mobile (`< md`): Rút gọn còn `[Prev] [Trang 3/10] [Next]`.
- Disabled Prev khi ở trang 1, disabled Next khi ở trang cuối.

```jsx
const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-3 md:hidden">
      <Button variant="secondary" size="sm" onClick={() => onChange(page - 1)} isDisabled={page === 1}>
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-content-sub">Trang {page}/{totalPages}</span>
      <Button variant="secondary" size="sm" onClick={() => onChange(page + 1)} isDisabled={page === totalPages}>
        <ChevronRight size={16} />
      </Button>
    </div>
    <div className="hidden md:flex items-center gap-1">
      {/* ... render page buttons with ellipsis logic */}
    </div>
  </div>
);
```

### 11.12. Avatar

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Image | Initials | Icon]` + `[Status dot?]`

**Sizes**: `xs` (24px), `sm` (32px), `md` (40px), `lg` (56px), `xl` (80px)

**Fallback logic**: Ảnh -> Initials (lấy chữ cái đầu họ + tên) -> Icon người dùng mặc định.

**Status dot**: Xanh = online, Xám = offline, Vàng = away. Dot ở góc bottom-right.

```jsx
const Avatar = ({ src, name, size = 'md', status }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-body', lg: 'w-14 h-14 text-h3', xl: 'w-20 h-20 text-h2' };
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="relative inline-block">
      <div className={`${sizes[size]} rounded-full bg-primary-100 text-primary-500 font-semibold flex items-center justify-center overflow-hidden`}>
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials ?? <User size={16} />}
      </div>
      {status && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background-surface
          ${status === 'online' ? 'bg-success' : status === 'away' ? 'bg-warning' : 'bg-content-sub'}`} />
      )}
    </div>
  );
};
```

### 11.13. Skeleton Loader

> ⭐ **Mới trong v3.0**

**Nguyên tắc**: Skeleton phải **phản ánh đúng cấu trúc** của nội dung thật — không dùng skeleton generic hình chữ nhật cho mọi thứ.

**Variants**: `text`, `card`, `table-row`, `avatar`, `chart`

```jsx
const Skeleton = ({ className }) => (
  <div className={`bg-background-app rounded animate-skeleton-shimmer
    bg-[linear-gradient(90deg,oklch(var(--color-bg-app))_25%,oklch(var(--color-border))_50%,oklch(var(--color-bg-app))_75%)]
    bg-[size:200%_100%] ${className}`}
    aria-hidden="true"
  />
);

const StudentCardSkeleton = () => (
  <div className="p-6 bg-background-surface rounded-[var(--radius-panel)] border border-border">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-8 w-16 rounded-lg" />
  </div>
);

const TableRowSkeleton = ({ columns = 4 }) => (
  <tr className="border-b border-border">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className={`h-4 ${i === 0 ? 'w-32' : i === columns - 1 ? 'w-16' : 'w-24'}`} />
      </td>
    ))}
  </tr>
);
```

### 11.14. Empty State

> ⭐ **Mới trong v3.0**

**Anatomy**: `[Illustration/Icon] + [Title] + [Description] + [CTA Button?]`

**Variants**

| Variant | Khi nào | CTA |
|---|---|---|
| `no-data` | Bảng/danh sách chưa có dữ liệu | "Tạo kỳ thi đầu tiên" |
| `no-results` | Search/filter không ra kết quả | "Xóa bộ lọc" |
| `no-permission` | Người dùng không có quyền | Không có CTA |
| `error` | Lỗi tải dữ liệu | "Thử lại" |

```jsx
const EmptyState = ({ variant = 'no-data', title, description, action }) => {
  const icons = {
    'no-data': <FileX size={48} className="text-content-sub" />,
    'no-results': <SearchX size={48} className="text-content-sub" />,
    'no-permission': <ShieldOff size={48} className="text-content-sub" />,
    'error': <AlertTriangle size={48} className="text-warning" />,
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-background-app flex items-center justify-center">
        {icons[variant]}
      </div>
      <div className="space-y-1 max-w-xs">
        <h3 className="text-h3 font-semibold text-content-main">{title}</h3>
        <p className="text-body text-content-sub">{description}</p>
      </div>
      {action && <Button variant="primary" size="md" {...action}>{action.label}</Button>}
    </div>
  );
};

<EmptyState
  variant="no-data"
  title="Chưa có kỳ thi nào"
  description="Hãy tạo kỳ thi đầu tiên để bắt đầu theo dõi kết quả học sinh."
  action={{ label: "Tạo kỳ thi", onClick: handleCreate, leftIcon: <Plus size={16} /> }}
/>
```

### 11.15. AuthEdgeLayout

> ⭐ **Mới trong v3.0** — Component bắt buộc cho mọi trang xác thực.

**Anatomy**: `[Hero Panel (trái/trên)] + [Form Panel (phải/dưới)]`

**Properties**: `heroImage`, `heroTitle`, `heroSubtitle`, `logoSrc`, `children`

**Layout Rules**
- **Desktop** (≥ `md`): 2 cột — Hero 45% bên trái, Form 55% bên phải.
- **Mobile** (< `md`): Hero thu nhỏ thành banner 200px phía trên, Form bên dưới.
- Hero image: `object-cover`, có gradient mask ở cạnh phải (desktop) / cạnh dưới (mobile) để hòa vào nền form.
- Form panel: Căn giữa theo chiều dọc, padding `p-8 md:p-12`, max-width form content `max-w-sm`.
- Logo luôn xuất hiện ở top-left của Form panel.

```jsx
const AuthEdgeLayout = ({ heroImage, heroTitle, heroSubtitle, logoSrc, children }) => (
  <div className="min-h-screen flex flex-col md:flex-row">
    <div className="relative h-[200px] md:h-auto md:w-[45%] overflow-hidden">
      <img src={heroImage} alt="" className="w-full h-full object-cover" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-background-surface" />
      {heroTitle && (
        <div className="absolute bottom-6 left-6 right-6 md:hidden">
          <h1 className="text-h2 font-bold text-white drop-shadow">{heroTitle}</h1>
        </div>
      )}
    </div>

    <div className="flex-1 md:w-[55%] flex flex-col justify-center p-8 md:p-12 bg-background-surface">
      {logoSrc && <img src={logoSrc} alt="Examxy" className="h-8 w-auto mb-8 md:mb-12" />}
      <div className="w-full max-w-sm mx-auto">
        {children}
      </div>
    </div>
  </div>
);
```

---

## 12. Form Validation Pattern

> ⭐ **Mới trong v3.0** — Định nghĩa rõ *khi nào* và *cách nào* validate.

### 12.1. Chiến Lược Validate

EDS v3.0 áp dụng chiến lược **"Validate on Blur, Show on Submit"**:

| Thời điểm | Hành động |
|---|---|
| Đang gõ (`onChange`) | **Không** hiện error. Chỉ clear error nếu field đang có error và người dùng đang sửa. |
| Rời khỏi field (`onBlur`) | Validate field đó. Hiện error ngay nếu có. |
| Nhấn Submit | Validate tất cả fields. Focus vào field lỗi đầu tiên. |
| Sau khi sửa lỗi (`onChange` khi field đang error) | Clear error ngay lập tức để feedback tích cực. |

### 12.2. Error Message Guidelines

```text
✅ "Email không hợp lệ. Vui lòng nhập đúng định dạng (vd: ten@email.com)"
❌ "Email sai"

✅ "Mật khẩu cần ít nhất 8 ký tự, bao gồm chữ hoa và số"
❌ "Mật khẩu không đủ mạnh"

✅ "Không tìm thấy tài khoản với email này. Bạn muốn đăng ký?"
❌ "Đăng nhập thất bại"
```

### 12.3. Implementation Pattern

```jsx
const useFormValidation = (rules) => {
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (name, value) => {
    const rule = rules[name];
    if (!rule) return null;
    for (const check of rule) {
      const error = check(value);
      if (error) return error;
    }
    return null;
  };

  const handleBlur = (name, value) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (name, value) => {
    if (errors[name]) {
      const error = validateField(name, value);
      if (!error) setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateAll = (values) => {
    const newErrors = {};
    Object.keys(rules).forEach(name => {
      newErrors[name] = validateField(name, values[name]);
    });
    setErrors(newErrors);
    return Object.values(newErrors).every(e => !e);
  };

  return { errors, handleBlur, handleChange, validateAll };
};
```

### 12.4. Validation Rules Library

```javascript
export const rules = {
  required: (msg = 'Trường này là bắt buộc') =>
    (v) => (!v || v.trim() === '') ? msg : null,
  
  email: () =>
    (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email không hợp lệ' : null,
  
  minLength: (n, msg) =>
    (v) => v && v.length < n ? (msg ?? `Tối thiểu ${n} ký tự`) : null,
  
  maxLength: (n, msg) =>
    (v) => v && v.length > n ? (msg ?? `Tối đa ${n} ký tự`) : null,
  
  studentCode: () =>
    (v) => v && !/^\d{10}$/.test(v) ? 'Mã học sinh gồm đúng 10 chữ số' : null,
  
  scoreRange: (min = 0, max = 10) =>
    (v) => (v !== '' && (isNaN(v) || v < min || v > max)) ? `Điểm phải từ ${min} đến ${max}` : null,
};
```

---

## 13. Dark Mode Per-Component

> ⭐ **Mới trong v3.0** — Hướng dẫn cụ thể cho từng component.

### 13.1. Nguyên Tắc

- Các component **KHÔNG** hardcode màu — chỉ dùng design tokens (`bg-background-surface`, `text-content-main`...).
- Tokens đã được định nghĩa trong CSS variables dark mode (Section 2.1) — component tự động thích nghi.
- **Chỉ** cần dùng `dark:` modifier khi token không đủ xử lý (ví dụ: shadow, gradient cụ thể).

### 13.2. Các Trường Hợp Cần `dark:` Modifier

```jsx
<div className="shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]">

<div className="bg-black/40 dark:bg-black/60">

<div className="bg-gradient-to-r from-transparent to-white dark:to-[oklch(0.18_0.02_264)]">

<div className="bg-[linear-gradient(...light-colors...)] dark:bg-[linear-gradient(...dark-colors...)]">
```

### 13.3. Checklist Dark Mode cho Component mới

```text
☐ Không hardcode màu HEX/RGB
☐ Dùng token từ color system
☐ Test contrast ≥ 4.5:1 trong cả light và dark mode
☐ Kiểm tra shadow có đủ visible trong dark mode không
☐ Kiểm tra gradient/overlay có cần điều chỉnh không
☐ Kiểm tra focus ring visible trong dark mode
```

---

## 14. Accessibility Guidelines (WCAG 2.2)

### 14.1. Nguyên Tắc P.O.U.R.

| Nguyên tắc | Yêu cầu cụ thể |
|---|---|
| **Perceivable** | Contrast ≥ 4.5:1 (text), 3:1 (UI/icon). Không dùng màu đơn độc. Alt text cho ảnh. |
| **Operable** | Tab order logic. Focus visible rõ ràng. Touch target ≥ 44px. Không có bẫy focus. |
| **Understandable** | Error message rõ ràng, có hướng dẫn. Label đầy đủ cho form fields. |
| **Robust** | Semantic HTML. ARIA roles đúng chỗ. Test với screen reader. |

### 14.2. ARIA Patterns Chuẩn

```jsx
<div role="dialog" aria-modal="true" aria-labelledby="title-id" aria-describedby="desc-id">

<button aria-busy="true" aria-label="Đang xử lý...">

<input aria-invalid="true" aria-describedby="error-msg-id" />
<p id="error-msg-id" role="alert">{errorMessage}</p>

<th aria-sort="ascending">Tên học sinh</th>

<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
</div>
<div role="tabpanel" id="panel-1">...</div>

<button aria-label="Xóa học sinh Nguyễn Văn A">
  <Trash2 size={16} aria-hidden="true" />
</button>
```

### 14.3. Keyboard Navigation

| Component | Keys cần hỗ trợ |
|---|---|
| Modal | `Escape` -> đóng, `Tab`/`Shift+Tab` -> focus trap |
| Dropdown | `Arrow Up/Down` -> navigate, `Enter` -> select, `Escape` -> đóng |
| Tabs | `Arrow Left/Right` -> switch tab |
| Data Table | `Space` -> select row, `Enter` -> expand (nếu expandable) |
| MC Options | `Arrow` -> di chuyển, `Space` -> select |

---

## 15. Tone of Voice & Copywriting

### 15.1. Nguyên Tắc Giọng Văn

- **Chuyên nghiệp nhưng gần gũi**: Rõ ràng, ngắn gọn, tránh thuật ngữ kỹ thuật.
- **Câu tích cực**: "Hãy lưu bài thi của bạn" thay vì "Đừng quên lưu bài thi".
- **Tập trung vào lợi ích**: Nhấn mạnh giá trị, không chỉ mô tả chức năng.

### 15.2. Copy Patterns Theo Bối Cảnh

| Bối cảnh | Pattern | Ví dụ |
|---|---|---|
| Lỗi validation | `[Vấn đề] + [Hướng dẫn cụ thể]` | "Email không hợp lệ. Vui lòng nhập đúng định dạng." |
| Lỗi hệ thống | `[Gì xảy ra] + [Người dùng làm gì]` | "Không thể kết nối. Vui lòng thử lại sau ít phút." |
| Thành công | `[Kết quả] + [Bước tiếp theo nếu có]` | "Nộp bài thành công! Điểm sẽ được cập nhật sớm." |
| Empty state | `[Trạng thái hiện tại] + [CTA rõ ràng]` | "Chưa có kỳ thi nào. Tạo kỳ thi đầu tiên để bắt đầu." |
| Loading | `Verb tiếp diễn` | "Đang tải danh sách...", "Đang phân tích bài thi..." |
| Cảnh báo | `[Ảnh hưởng] + [Hành động]` | "Còn 5 phút. Hãy kiểm tra lại bài trước khi nộp." |

### 15.3. Từ Ngữ Cần Tránh

| Tránh | Dùng thay |
|---|---|
| "Error", "Bug", "Exception" | "Có lỗi xảy ra", "Không thành công" |
| "Invalid" | "Không hợp lệ" / mô tả cụ thể hơn |
| "N/A", "Null" | "Chưa có thông tin" |
| "Click" (chỉ dùng chuột) | "Nhấn", "Chọn" (hoạt động cả touch) |
| "Submit" | "Nộp bài", "Xác nhận", "Lưu lại" |

---

## 16. Contribution Process

### 16.1. Quy Trình 3 Bước

**Bước 1 — Problem Framing**: Bắt đầu từ nhu cầu thực tế.
> "Chúng ta cần hiển thị thông báo lỗi nghiêm trọng đòi hỏi sự chú ý ngay lập tức" -> không phải "Cần một bảng thông báo màu đỏ".

**Bước 2 — System Audit**: Trước khi tạo mới, kiểm tra:
- Component hiện có có giải quyết được không?
- Có thể dùng Variant hoặc Slot của component cũ?
- Tính đa năng (Versatile) là tiêu chí duyệt.

**Bước 3 — Proposal & PR**: Issue/MR phải có:
- Tuyên bố vấn đề đang giải quyết
- Phân tích các phương án đã thử
- Mức độ cần hỗ trợ (tự triển khai / cần review)
- Documentation đầy đủ: anatomy, props, states, code mẫu

### 16.2. Checklist Component Trước Khi Merge

```text
☐ Có đủ documentation (anatomy, props, states, behavior)
☐ Có code mẫu hoạt động được
☐ Đã test dark mode
☐ Đã test mobile (< 768px), touch target ≥ 44px
☐ Đã thêm aria attributes phù hợp
☐ Đã test keyboard navigation
☐ Đã test với prefers-reduced-motion
☐ Contrast ratio đạt WCAG 2.2 AA
☐ Đã thêm vào Storybook / Component Gallery
☐ Đã cập nhật CHANGELOG
```

### 16.3. Nguyên Tắc "Không Thêm Mới Khi Có Thể Mở Rộng"

Trước khi tạo component mới, hỏi:
1. **Variant**: Component cũ có thể thêm variant mới không?
2. **Slot**: Component cũ có thể thêm slot (children prop) để nhận nội dung tùy biến không?
3. **Composition**: Có thể compose từ 2+ component nhỏ hơn đã có không?
4. **New**: Chỉ tạo mới khi 3 câu trên đều là "Không".

---

*EDS v3.0 — Cập nhật lần cuối: 2026. Mọi thắc mắc hoặc đóng góp, mở Issue trên repository.*
