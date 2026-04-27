# EDS v3.0 — Dark Mode Per-Component

## Core Principle

Components **do NOT hardcode colors** — they use design tokens only (`bg-background-surface`, `text-content-main`, etc.). The dark-mode CSS variable overrides in `01-tokens-colors.md` handle adaptation automatically.

Use `dark:` modifier only when tokens are insufficient.

## When `dark:` Modifier Is Needed

These four situations require explicit dark overrides:

### 1. Shadows (not visible in dark mode by default)

```jsx
<div className="shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
```

### 2. Semi-transparent dark overlays

```jsx
<div className="bg-black/40 dark:bg-black/60">
```

### 3. Gradients that reference light-mode surface colors

```jsx
<div className="bg-gradient-to-r from-transparent to-white dark:to-[oklch(0.18_0.02_264)]">
```

### 4. Shimmer / skeleton background gradients

```jsx
<div className="bg-[linear-gradient(90deg,oklch(0.98_0.01_264)_25%,oklch(0.90_0.02_264)_50%,oklch(0.98_0.01_264)_75%)]
                dark:bg-[linear-gradient(90deg,oklch(0.13_0.01_264)_25%,oklch(0.28_0.02_264)_50%,oklch(0.13_0.01_264)_75%)]">
```

## Dark Mode Checklist for New Components

```
☐ No hardcoded hex/rgb/hsl colors anywhere
☐ All colors come from design tokens (Section 01)
☐ Contrast ratio ≥ 4.5:1 verified in both light and dark mode
☐ Shadows are visible in dark mode (add dark: override if needed)
☐ Gradients/overlays checked and adjusted for dark mode
☐ Focus ring is visible in dark mode
☐ Skeleton shimmer gradient updated for dark mode
☐ Any border-based separators have sufficient contrast in dark mode
```

## Quick Reference: Token Behavior in Dark Mode

| Token                    | Light value       | Dark value                              |
| ------------------------ | ----------------- | --------------------------------------- |
| `bg-background-app`      | Near white        | Very dark purple-gray                   |
| `bg-background-surface`  | White             | Dark purple-gray                        |
| `bg-background-elevated` | Off-white         | Slightly lighter dark                   |
| `text-content-main`      | Near black        | Near white                              |
| `text-content-sub`       | Medium gray       | Muted light gray                        |
| `border`                 | Light gray        | Dark border                             |
| `primary-50`             | Very light purple | Dark muted purple (replaces light tint) |

> All these are handled by the CSS variable overrides in the `.dark` block — components using these tokens adapt automatically.
