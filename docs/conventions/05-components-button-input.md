# EDS v3.0 — Components: Button & TextField

## Button

### Anatomy

`[Leading Icon] + [Label] + [Trailing Icon]` inside a Container

### Variants

| Variant     | Background    | Text           | Border   | Use when                             |
| ----------- | ------------- | -------------- | -------- | ------------------------------------ |
| `primary`   | `primary-500` | white          | —        | Primary CTA: "Submit", "Create exam" |
| `secondary` | transparent   | `content.main` | `border` | Secondary actions                    |
| `ghost`     | transparent   | `primary-500`  | —        | Low-priority actions                 |
| `danger`    | `error`       | white          | —        | Delete, Cancel                       |
| `success`   | `success`     | white          | —        | Confirm completion                   |

### Sizes

| Size | Height | Padding       | Font        | Radius        |
| ---- | ------ | ------------- | ----------- | ------------- |
| `sm` | 32px   | `px-3 py-1.5` | `text-sm`   | `--radius-sm` |
| `md` | 40px   | `px-5 py-2.5` | `text-body` | `--radius-md` |
| `lg` | 48px   | `px-6 py-3`   | `text-body` | `--radius-md` |

### States

```
Default  → Hover (primary-600) → Active/Pressed (primary-700, scale 0.98)
Focused  → outline 2px solid focus-ring, offset 2px
Disabled → disabled-bg background, disabled-text color, cursor-not-allowed, no hover effect
Loading  → centered Spinner, label hidden, width preserved (use min-w)
```

### Code

```jsx
const Button = ({
  variant = "primary",
  size = "md",
  isLoading,
  isDisabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}) => {
  const base = [
    "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap",
    "transition-all duration-fast ease-standard",
    "active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
  ].join(" ");

  const variants = {
    primary:
      "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
    secondary:
      "bg-transparent text-content-main border border-border hover:bg-background-app",
    ghost: "bg-transparent text-primary-500 hover:bg-primary-50",
    danger: "bg-error text-white hover:opacity-90",
    success: "bg-success text-white hover:opacity-90",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm rounded-[var(--radius-sm)]",
    md: "h-10 px-5 text-body rounded-[var(--radius-md)] min-h-[44px] md:min-h-[40px]",
    lg: "h-12 px-6 text-body rounded-[var(--radius-md)] min-h-[44px]",
  };

  return (
    <button
      disabled={isDisabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
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

---

## TextField

### Anatomy

`[Label] → [Input Container ([Leading Icon?] + [Input] + [Trailing Icon?])] → [Helper/Error Text]`

### Variants

`text` | `password` | `search` | `number` | `textarea`

### States

| State      | Border            | Shadow                                | Notes                                       |
| ---------- | ----------------- | ------------------------------------- | ------------------------------------------- |
| `default`  | `border` 1px      | —                                     |                                             |
| `focused`  | `primary-500` 2px | `0 0 0 3px oklch(primary-500 / 0.15)` |                                             |
| `error`    | `error` 2px       | `0 0 0 3px oklch(error / 0.15)`       | Shake animation on transition to error      |
| `disabled` | `disabled-border` | —                                     | `cursor-not-allowed`, `background.app` fill |
| `success`  | `success` 2px     | —                                     | Show checkmark trailing icon                |

### Code

```jsx
import { AlertCircle } from "lucide-react";

const TextField = ({
  label,
  placeholder,
  error,
  hint,
  type = "text",
  leadingIcon,
  trailingIcon,
  ...props
}) => {
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-label text-content-main">{label}</label>}

      <div
        className={[
          "flex items-center gap-2 px-3 rounded-[var(--radius-input)] border bg-background-surface",
          "transition-all duration-fast",
          hasError
            ? "border-error border-2 shadow-[0_0_0_3px_oklch(var(--color-error)/0.15)] animate-shake"
            : "border-border focus-within:border-primary-500 focus-within:border-2 focus-within:shadow-[0_0_0_3px_oklch(var(--color-primary-500)/0.15)]",
        ].join(" ")}
      >
        {leadingIcon && <span className="text-content-sub">{leadingIcon}</span>}

        <input
          type={type}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${props.id}-error` : undefined}
          className="flex-1 h-11 md:h-10 bg-transparent text-body text-content-main placeholder:text-content-sub outline-none"
          {...props}
        />

        {trailingIcon && (
          <span className="text-content-sub">{trailingIcon}</span>
        )}
      </div>

      {(error || hint) && (
        <p
          id={`${props.id}-error`}
          role={hasError ? "alert" : undefined}
          className={`text-xs mt-0.5 flex items-center gap-1 ${hasError ? "text-error" : "text-content-sub"}`}
        >
          {hasError && <AlertCircle size={12} aria-hidden="true" />}
          {error || hint}
        </p>
      )}
    </div>
  );
};
```

## Multiple Choice Option (MCOption)

### Anatomy

`[Drag Handle?] + [Control] + [Letter] + [Content]`

### States

| Status     | Background           | Border            | Text            |
| ---------- | -------------------- | ----------------- | --------------- |
| `default`  | `background.surface` | `border`          | `content.main`  |
| `selected` | `primary-50`         | `primary-500` 2px | `content.main`  |
| `correct`  | `success`            | `success`         | white           |
| `wrong`    | `error`              | `error`           | white           |
| `disabled` | `disabled-bg`        | `disabled-border` | `disabled-text` |

### Code

```jsx
import { GripVertical } from "lucide-react";

const MCOption = ({
  type = "single",
  letter,
  content,
  status = "default",
  isBuilderMode,
}) => {
  const statusClasses = {
    default: "bg-background-surface border-border",
    selected: "bg-primary-50 border-primary-500 border-2",
    correct: "bg-success border-success text-white",
    wrong: "bg-error border-error text-white",
    disabled:
      "bg-disabled-bg border-disabled-border text-content-disabled cursor-not-allowed",
  };

  return (
    <div
      className={`group relative flex items-center gap-3 p-4 rounded-[var(--radius-md)] border cursor-pointer transition-all duration-fast min-h-[44px] ${statusClasses[status]}`}
    >
      {isBuilderMode && (
        <GripVertical
          className="absolute left-1 opacity-0 group-hover:opacity-100 transition-opacity text-content-sub"
          size={16}
          aria-hidden="true"
        />
      )}
      {type === "single" ? (
        <RadioIndicator status={status} />
      ) : (
        <CheckboxIndicator status={status} />
      )}
      <span className="font-mono font-semibold text-sm w-5">{letter}</span>
      <span className="flex-1 text-body">{content}</span>
    </div>
  );
};
```
