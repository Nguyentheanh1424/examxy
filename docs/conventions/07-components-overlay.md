# EDS v3.0 — Components: Overlays (Modal, Dropdown, Toast)

## Modal / Dialog

### Anatomy

`[Backdrop] → [Dialog Container ([Header] + [Body] + [Footer])]`

### Variants (max-width)

| Size         | Max Width                |
| ------------ | ------------------------ |
| `sm`         | 480px                    |
| `md`         | 640px                    |
| `lg`         | 800px                    |
| `fullscreen` | 100vw × 100vh, no radius |

### Props

`title`, `description`, `size`, `isOpen`, `onClose`, `isDismissable`

### Behavior

- Backdrop: `background.overlay` at 60% opacity, `backdrop-blur-sm`.
- **Open**: Backdrop fade-in 200ms + Dialog `slide-up` + `fade-in` 250ms (`ease-entrance`).
- **Close**: Dialog fade-out 150ms (`ease-exit`) + Backdrop fade-out.
- While open: `body { overflow: hidden }` to prevent background scroll.
- **Focus trap**: Tab key cycles only within the modal.
- Close triggers: ✕ button, click backdrop (if `isDismissable`), `Escape` key.
- Z-index: Backdrop `z-overlay` (300), Content `z-modal` (400).
- On mobile: mounts at bottom like a bottom sheet (`rounded-t-[var(--radius-panel)]`).

### Code

```jsx
import { X } from "lucide-react";

const Modal = ({
  title,
  description,
  size = "md",
  isOpen,
  onClose,
  isDismissable = true,
  children,
  footer,
}) => {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-3xl",
    fullscreen: "w-screen h-screen rounded-none",
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay/60 backdrop-blur-sm animate-fade-in"
        onClick={isDismissable ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${sizes[size]} bg-background-surface rounded-t-[var(--radius-panel)] sm:rounded-[var(--radius-panel)] shadow-2xl z-modal animate-slide-up`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div>
            <h2
              id="modal-title"
              className="text-h3 font-semibold text-content-main"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-content-sub mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-app text-content-sub"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## Dropdown / Select

### Anatomy

`[Trigger Button] → [Menu Panel ([Search?] + [Option List])]`

### Variants

| Variant        | Description                        |
| -------------- | ---------------------------------- |
| `select`       | Single selection                   |
| `multi-select` | Multiple selection with checkboxes |
| `command`      | Single selection with search input |

### Props

`options`, `value`, `onChange`, `placeholder`, `isSearchable`, `isMulti`, `isDisabled`

### Behavior

- Menu appears directly below trigger (or above if space is insufficient).
- Z-index: `z-dropdown` (200).
- Closes on: outside click, option select (single mode), `Escape` key.
- Maximum 8 visible options before scrolling.
- `isSearchable`: Shows search input at top of menu.

### Option Code

```jsx
import { Check } from "lucide-react";

const DropdownOption = ({ label, value, isSelected, icon }) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg text-body transition-colors duration-fast
    ${
      isSelected
        ? "bg-primary-50 text-primary-500 font-medium"
        : "text-content-main hover:bg-background-app"
    }`}
  >
    {icon && <span aria-hidden="true">{icon}</span>}
    <span className="flex-1">{label}</span>
    {isSelected && <Check size={16} aria-hidden="true" />}
  </div>
);
```

### Keyboard Navigation

- `Arrow Up / Down` → navigate options
- `Enter` → select focused option
- `Escape` → close menu

---

## Toast / Notification

### Anatomy

`[Icon] + [Content (Title + Description?)] + [Action?] + [Close?]`

### Variants

`success` | `error` | `warning` | `info`

### Props

`variant`, `title`, `description`, `duration`, `action`, `isDismissable`

### Behavior

- **Position**: Bottom-center on mobile, Bottom-right on desktop. `z-toast` (500).
- **Default duration**: `4000ms`.
- **Error toasts**: Do NOT auto-dismiss (`duration: Infinity`) — require user action.
- **Maximum 3 toasts** visible at once — oldest is removed when a 4th is added.
- Animation in: `animate-toast-in`. Animation out: `animate-toast-out`.
- Stack from bottom up; newest toast is at the bottom.

### Config & Usage

```js
const toastConfig = {
  success: { bg: "bg-success", icon: CheckCircle2, text: "text-white" },
  error: { bg: "bg-error", icon: XCircle, text: "text-white" },
  warning: {
    bg: "bg-warning-soft",
    icon: AlertTriangle,
    text: "text-content-main",
  },
  info: { bg: "bg-info-soft", icon: Info, text: "text-content-main" },
};

// Usage
toast.success("Submitted successfully!", {
  description: "Scores will be updated within 5 minutes.",
});

toast.error("Connection error", {
  description: "Please try again.",
  duration: Infinity, // Must stay until dismissed
});

toast.warning("5 minutes remaining", {
  description: "The exam is almost over.",
});
```
