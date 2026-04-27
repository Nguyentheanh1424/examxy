# EDS v3.0 — Components: Feedback (Skeleton, Empty State, OMR Scanner)

## Skeleton Loader

### Principle

Skeletons must **mirror the actual content structure** — never use a generic rectangle skeleton for everything.

### Variants

`text` | `card` | `table-row` | `avatar` | `chart`

### Base Component

```jsx
const Skeleton = ({ className }) => (
  <div
    className={`bg-background-app rounded animate-skeleton-shimmer
      bg-[linear-gradient(90deg,oklch(var(--color-bg-app))_25%,oklch(var(--color-border))_50%,oklch(var(--color-bg-app))_75%)]
      bg-[size:200%_100%] ${className}`}
    aria-hidden="true"
  />
);
```

### Composed Variants

**Student Card Skeleton**

```jsx
const StudentCardSkeleton = () => (
  <div className="p-6 bg-background-surface rounded-[var(--radius-panel)] border border-border">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Name */}
        <Skeleton className="h-3 w-20" /> {/* Sub-info */}
      </div>
    </div>
    <Skeleton className="h-8 w-16 rounded-lg" /> {/* Score */}
  </div>
);
```

**Table Row Skeleton**

```jsx
const TableRowSkeleton = ({ columns = 4 }) => (
  <tr className="border-b border-border">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton
          className={`h-4 ${i === 0 ? "w-32" : i === columns - 1 ? "w-16" : "w-24"}`}
        />
      </td>
    ))}
  </tr>
);
```

### Accessibility

- All Skeleton elements must have `aria-hidden="true"` — they convey no information to screen readers.
- Wrap the skeleton section in a container with `aria-busy="true"` and `aria-label="Loading…"`.

---

## Empty State

### Anatomy

`[Illustration/Icon] + [Title] + [Description] + [CTA Button?]`

### Variants

| Variant         | When                          | CTA                 |
| --------------- | ----------------------------- | ------------------- |
| `no-data`       | Table/list has no entries yet | "Create first exam" |
| `no-results`    | Search/filter returns nothing | "Clear filters"     |
| `no-permission` | User lacks access             | None                |
| `error`         | Data failed to load           | "Try again"         |

### Code

```jsx
import { FileX, SearchX, ShieldOff, AlertTriangle } from "lucide-react";

const EmptyState = ({ variant = "no-data", title, description, action }) => {
  const icons = {
    "no-data": <FileX size={48} className="text-content-sub" />,
    "no-results": <SearchX size={48} className="text-content-sub" />,
    "no-permission": <ShieldOff size={48} className="text-content-sub" />,
    error: <AlertTriangle size={48} className="text-warning" />,
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
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          leftIcon={action.leftIcon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};
```

### Usage Examples

```jsx
// No data yet
<EmptyState
  variant="no-data"
  title="No exams yet"
  description="Create your first exam to start tracking student results."
  action={{ label: 'Create Exam', onClick: handleCreate, leftIcon: <Plus size={16} /> }}
/>

// Search returned nothing
<EmptyState
  variant="no-results"
  title="No results found"
  description={`No students match "${searchQuery}". Try a different search term.`}
  action={{ label: 'Clear filters', onClick: clearFilters }}
/>

// Load error
<EmptyState
  variant="error"
  title="Could not load data"
  description="Something went wrong. Please try again."
  action={{ label: 'Try again', onClick: refetch }}
/>
```

---

## OMR Scanner Viewfinder

### States

`searching` → `processing` → `success` | `error`

### State Behavior

| State        | Bounding Box                                          | User Feedback                                  |
| ------------ | ----------------------------------------------------- | ---------------------------------------------- |
| `searching`  | Dashed border, `animate-scanner-breathe`              | Toast: "Looking for answer sheet…"             |
| `processing` | Solid border, light blue tint, scanning bar animation | Toast: "Analyzing…"                            |
| `success`    | `success` color, thick solid border                   | Haptic feedback + "beep" sound + success Toast |
| `error`      | `error` color, shake animation                        | Error Toast + retry instructions               |

### Important Notes

- Viewfinder must have `aria-live="polite"` region announcing state changes.
- In `searching` state, `animate-scanner-breathe` is disabled under `prefers-reduced-motion`.
- Scanning bar animation in `processing` is also disabled under `prefers-reduced-motion`.
