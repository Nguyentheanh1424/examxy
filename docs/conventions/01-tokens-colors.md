# EDS v3.0 — Color Tokens

## CSS Variables (Light & Dark)

```css
@layer base {
  :root {
    /* ── Brand Primary (oklch: L C H) ── */
    --color-primary-50: 0.97 0.02 264;
    --color-primary-100: 0.95 0.03 264;
    --color-primary-200: 0.88 0.06 264;
    --color-primary-300: 0.75 0.12 264;
    --color-primary-400: 0.6 0.2 264;
    --color-primary-500: 0.45 0.26 264; /* Main brand — CTA buttons */
    --color-primary-600: 0.4 0.26 264; /* Hover state */
    --color-primary-700: 0.34 0.24 264; /* Active/pressed state */

    /* ── Semantic ── */
    --color-success: 0.65 0.15 146;
    --color-success-soft: 0.93 0.05 146;
    --color-error: 0.55 0.2 29;
    --color-error-soft: 0.95 0.05 29;
    --color-warning: 0.75 0.15 80;
    --color-warning-soft: 0.97 0.04 80;
    --color-info: 0.6 0.15 230;
    --color-info-soft: 0.95 0.03 230;

    /* ── Interactive States ── */
    --color-focus-ring: 0.45 0.26 264;
    --color-disabled-bg: 0.92 0.01 264;
    --color-disabled-text: 0.65 0.02 264;
    --color-disabled-border: 0.85 0.01 264;

    /* ── Surfaces & Neutrals ── */
    --color-bg-app: 0.98 0.01 264; /* Page background */
    --color-bg-surface: 1 0 0; /* Card / panel background */
    --color-bg-elevated: 0.99 0.005 264; /* Dropdowns, popovers */
    --color-text-main: 0.2 0.02 264;
    --color-text-sub: 0.5 0.02 264;
    --color-text-disabled: 0.65 0.02 264;
    --color-border: 0.9 0.02 264;
    --color-border-strong: 0.75 0.03 264;

    /* ── Overlay ── */
    --color-overlay: 0.1 0.02 264;
  }

  .dark {
    --color-primary-50: 0.18 0.03 264;
    --color-primary-100: 0.22 0.05 264;
    --color-bg-app: 0.13 0.01 264;
    --color-bg-surface: 0.18 0.02 264;
    --color-bg-elevated: 0.22 0.02 264;
    --color-text-main: 0.95 0.01 264;
    --color-text-sub: 0.65 0.02 264;
    --color-border: 0.28 0.02 264;
    --color-border-strong: 0.45 0.03 264;
    --color-disabled-bg: 0.25 0.01 264;
    --color-overlay: 0.05 0.01 264;
  }
}
```

## Tailwind Color Config

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "oklch(var(--color-primary-50) / <alpha-value>)",
          100: "oklch(var(--color-primary-100) / <alpha-value>)",
          200: "oklch(var(--color-primary-200) / <alpha-value>)",
          300: "oklch(var(--color-primary-300) / <alpha-value>)",
          400: "oklch(var(--color-primary-400) / <alpha-value>)",
          500: "oklch(var(--color-primary-500) / <alpha-value>)",
          600: "oklch(var(--color-primary-600) / <alpha-value>)",
          700: "oklch(var(--color-primary-700) / <alpha-value>)",
        },
        success: "oklch(var(--color-success) / <alpha-value>)",
        "success-soft": "oklch(var(--color-success-soft) / <alpha-value>)",
        error: "oklch(var(--color-error) / <alpha-value>)",
        "error-soft": "oklch(var(--color-error-soft) / <alpha-value>)",
        warning: "oklch(var(--color-warning) / <alpha-value>)",
        "warning-soft": "oklch(var(--color-warning-soft) / <alpha-value>)",
        info: "oklch(var(--color-info) / <alpha-value>)",
        "info-soft": "oklch(var(--color-info-soft) / <alpha-value>)",
        background: {
          app: "oklch(var(--color-bg-app) / <alpha-value>)",
          surface: "oklch(var(--color-bg-surface) / <alpha-value>)",
          elevated: "oklch(var(--color-bg-elevated) / <alpha-value>)",
        },
        content: {
          main: "oklch(var(--color-text-main) / <alpha-value>)",
          sub: "oklch(var(--color-text-sub) / <alpha-value>)",
          disabled: "oklch(var(--color-text-disabled) / <alpha-value>)",
        },
        border: "oklch(var(--color-border) / <alpha-value>)",
        "border-strong": "oklch(var(--color-border-strong) / <alpha-value>)",
      },
    },
  },
};
```

## Color Usage Rules

| Situation                    | Correct token                  | ❌ Wrong               |
| ---------------------------- | ------------------------------ | ---------------------- |
| Primary CTA button           | `primary-500`                  | Hardcoded `#4F46E5`    |
| Secondary text, placeholders | `content.sub`                  | `text-gray-400`        |
| Focused input                | `border-strong` + `focus-ring` | `border-blue-500`      |
| Disabled state               | `disabled-bg`, `disabled-text` | arbitrary `opacity-50` |
| Elevated card / dropdown     | `background.elevated`          | `background.surface`   |

> ⚠️ **Invariant**: Color must NEVER be the sole means of conveying status. Every error must include icon + text alongside the red color.
