# EDS v3.0 — Components: Data Display

## DataTable

### Anatomy

`[Header (Sticky)] → [Rows] → [Pagination Footer]`

### Variants

- `standard` — 48px row height
- `compact` — 32px row height
- `expandable` — rows can expand to reveal detail

### Props

`columns`, `data`, `density`, `isSelectable`, `isSortable`, `isLoading`

### Behavior

- Header is **sticky** on vertical scroll (`position: sticky; top: 0; z-index: var(--z-sticky)`).
- Row hover → background changes to `background.app`.
- Text columns → align **left**. Number/score columns → align **right**, `font-mono`.
- `isLoading = true` → show **Skeleton rows**, not a full-screen spinner.
- No data → show **EmptyState** component (see `08-components-feedback.md`).

### Column Definition Example

```jsx
const columns = [
  {
    key: "name",
    label: "Full Name",
    align: "left",
    sortable: true,
  },
  {
    key: "score",
    label: "Score",
    align: "right",
    sortable: true,
    render: (v) => <span className="font-mono">{v}</span>,
  },
  {
    key: "time",
    label: "Time",
    align: "right",
    render: (v) => <span className="font-mono text-content-sub">{v}</span>,
  },
  {
    key: "status",
    label: "Status",
    align: "left",
    render: (v) => <Badge status={v} />,
  },
];
```

---

## Badge & Tag

### Anatomy

`[Dot?] + [Label]`

### Variants

| Variant   | Description              |
| --------- | ------------------------ |
| `solid`   | Strong filled background |
| `soft`    | Light tinted background  |
| `outline` | Border only              |

### Colors

`primary` | `success` | `error` | `warning` | `info` | `neutral`

### Sizes

- `sm` — height 20px, `text-xs`
- `md` — height 24px, `text-sm`

### Usage Examples

```jsx
<Badge variant="soft" color="success">Submitted</Badge>
<Badge variant="soft" color="warning">Not submitted</Badge>
<Badge variant="soft" color="error">Late submission</Badge>
<Badge variant="soft" color="neutral">Absent</Badge>
<Badge variant="solid" color="error" size="sm">12</Badge>
```

### Code

```jsx
const badgeClasses = {
  soft: {
    primary: "bg-primary-50 text-primary-500",
    success: "bg-success-soft text-success",
    error: "bg-error-soft text-error",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
    neutral: "bg-background-app text-content-sub",
  },
  solid: {
    primary: "bg-primary-500 text-white",
    success: "bg-success text-white",
    error: "bg-error text-white",
    warning: "bg-warning text-white",
    info: "bg-info text-white",
    neutral: "bg-content-sub text-white",
  },
  outline: {
    primary: "border border-primary-500 text-primary-500",
    success: "border border-success text-success",
    error: "border border-error text-error",
    warning: "border border-warning text-warning",
    info: "border border-info text-info",
    neutral: "border border-border text-content-sub",
  },
};

const Badge = ({
  variant = "soft",
  color = "neutral",
  size = "md",
  dot,
  children,
}) => (
  <span
    className={`inline-flex items-center gap-1 font-medium rounded-full px-2
    ${size === "sm" ? "h-5 text-xs" : "h-6 text-sm"}
    ${badgeClasses[variant][color]}`}
  >
    {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
    {children}
  </span>
);
```

---

## Avatar

### Anatomy

`[Image | Initials | Icon]` + optional `[Status dot]`

### Sizes

| Name | Size |
| ---- | ---- |
| `xs` | 24px |
| `sm` | 32px |
| `md` | 40px |
| `lg` | 56px |
| `xl` | 80px |

### Fallback Order

Image → Initials (first letter of first + last name) → Default user icon

### Status Dot

Dot at bottom-right corner: Green = online | Gray = offline | Yellow = away

### Code

```jsx
import { User } from "lucide-react";

const Avatar = ({ src, name, size = "md", status }) => {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-body",
    lg: "w-14 h-14 text-h3",
    xl: "w-20 h-20 text-h2",
  };

  const initials = name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative inline-block">
      <div
        className={`${sizes[size]} rounded-full bg-primary-100 text-primary-500 font-semibold flex items-center justify-center overflow-hidden`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          (initials ?? <User size={16} aria-hidden="true" />)
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background-surface
          ${status === "online" ? "bg-success" : status === "away" ? "bg-warning" : "bg-content-sub"}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
```

---

## Tabs & Navigation

### Variants

| Variant      | Use when                                      |
| ------------ | --------------------------------------------- |
| `underline`  | Primary page navigation (Dashboard, Results…) |
| `pill`       | Table filters, view toggles                   |
| `bottom-nav` | Fixed mobile bottom navigation                |

### Bottom Navigation Rules (Mobile)

- Fixed at `bottom: 0`, height `64px`, `z-sticky`.
- Maximum **5 items**. From 4+ items use icon + `text-xs` label.
- Active item: `primary-500` for icon + label, with indicator dot or pill underneath.

### Code

```jsx
const Tabs = ({ tabs, activeTab, onChange, variant = "underline" }) => (
  <div
    className={
      variant === "underline"
        ? "border-b border-border"
        : "flex gap-1 p-1 bg-background-app rounded-[var(--radius-md)]"
    }
  >
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        role="tab"
        aria-selected={activeTab === tab.key}
        className={
          variant === "underline"
            ? `px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-fast
               ${
                 activeTab === tab.key
                   ? "border-primary-500 text-primary-500"
                   : "border-transparent text-content-sub hover:text-content-main"
               }`
            : `px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-fast
               ${
                 activeTab === tab.key
                   ? "bg-background-surface shadow-sm text-content-main"
                   : "text-content-sub hover:text-content-main"
               }`
        }
      >
        {tab.label}
        {tab.count !== undefined && (
          <Badge variant="soft" color="neutral" size="sm" className="ml-1.5">
            {tab.count}
          </Badge>
        )}
      </button>
    ))}
  </div>
);
```

---

## Pagination

### Anatomy

`[Prev] + [Page numbers] + [Next]` + optional `[Per page selector]`

### Behavior

- Show maximum **7 page buttons** before using ellipsis `…`.
- Pattern: `[1] [2] [3] […] [8] [9] [10]` or `[1] […] [4] [5] [6] […] [10]`
- Mobile (`< md`): Collapse to `[Prev] [Page 3/10] [Next]`.
- Disable Prev on page 1; disable Next on last page.

### Code

```jsx
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-between gap-2">
    {/* Mobile layout */}
    <div className="flex items-center gap-3 md:hidden">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page - 1)}
        isDisabled={page === 1}
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="text-sm text-content-sub">
        Page {page}/{totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        isDisabled={page === totalPages}
      >
        <ChevronRight size={16} />
      </Button>
    </div>

    {/* Desktop layout */}
    <div className="hidden md:flex items-center gap-1">
      {/* Render page buttons with ellipsis logic */}
    </div>
  </div>
);
```
