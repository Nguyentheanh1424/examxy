# EDS v3.0 — Typography, Spacing, Radius & Z-Index Tokens

## Typography

### Font Stack

```js
fontFamily: {
  sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
}
```

### Type Scale (Fluid)

```js
fontSize: {
  'display': ['clamp(2rem, 1.5rem + 2.5vw, 3rem)',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
  'h1':      ['clamp(1.75rem, 1.35rem + 2vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
  'h2':      ['clamp(1.375rem, 1.175rem + 1vw, 1.875rem)', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
  'h3':      ['clamp(1.125rem, 1.025rem + 0.5vw, 1.25rem)', { lineHeight: '1.4' }],
  'body':    ['1rem',     { lineHeight: '1.6' }],
  'sm':      ['0.875rem', { lineHeight: '1.5' }],
  'xs':      ['0.75rem',  { lineHeight: '1.4' }],
  'label':   ['0.75rem',  { lineHeight: '1', letterSpacing: '0.06em', fontWeight: '600' }],
  'mono-sm': ['0.8125rem',{ lineHeight: '1.5' }],
}
```

### Typography Rules

- Body text **minimum 16px** on all mobile devices.
- `text-xs` (12px) allowed only for: secondary table labels, timestamps, badge counts.
- **Mono font** for: scores, student IDs, timestamps, statistical numbers.
- **Never mix more than 2 font weights** in a single card.

---

## Spacing Scale

### CSS Variables

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
}
```

### Tailwind Mapping

```js
spacing: {
  '1': '4px', '2': '8px', '3': '12px', '4': '16px',
  '5': '20px', '6': '24px', '8': '32px', '10': '40px',
  '12': '48px', '16': '64px', '20': '80px',
}
```

### Spacing Usage Reference

| Context                    | Token                                    | Tailwind         |
| -------------------------- | ---------------------------------------- | ---------------- |
| Gap between icon and label | `--space-2`                              | `gap-2`          |
| Button `sm` padding        | `--space-3` H / `--space-2` V            | `px-3 py-2`      |
| Button `md` padding        | `--space-5` H / `--space-3` V            | `px-5 py-3`      |
| Button `lg` padding        | `--space-6` H / `--space-4` V            | `px-6 py-4`      |
| Card inner padding         | `--space-6`                              | `p-6`            |
| Gap between cards          | `--space-4` mobile / `--space-6` desktop | `gap-4 md:gap-6` |
| Label → input gap          | `--space-2`                              | `mb-2`           |
| Input → helper text gap    | `--space-1`                              | `mt-1`           |
| Gap between sections       | `--space-8`                              | `mb-8`           |

---

## Border Radius Tokens

### CSS Variables

```css
:root {
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-input: 12px;
  --radius-md: 16px;
  --radius-panel: 20px;
  --radius-full: 9999px;
}
```

### Radius Usage Rules

| Element                    | Token                   | Notes                                    |
| -------------------------- | ----------------------- | ---------------------------------------- |
| Large panels & cards       | `--radius-panel` (20px) | Never use `rounded-3xl` (24px) or higher |
| Inputs & selects           | `--radius-input` (12px) |                                          |
| Buttons md/lg              | `--radius-md` (16px)    | Do not turn wide buttons into pills      |
| Small buttons / chips      | `--radius-sm` (8px)     |                                          |
| Tags, avatars, status dots | `--radius-full`         |                                          |
| Auth mobile layout         | Edge-to-edge (0)        | See `09-components-layout.md`            |

---

## Z-Index Layer System

### CSS Variables

```css
:root {
  --z-base: 0;
  --z-raised: 10;
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-overlay: 300;
  --z-modal: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

### Tailwind Mapping

```js
zIndex: {
  'base': '0', 'raised': '10', 'sticky': '100',
  'dropdown': '200', 'overlay': '300', 'modal': '400',
  'toast': '500', 'tooltip': '600',
}
```

### Z-Index Rules

- **Never** use arbitrary z-index numbers outside this table. Open an issue to add new layers.
- Each element type belongs to exactly one layer. Tooltips cannot be at `z-modal`.
- Modal backdrop → `z-overlay`. Modal content → `z-modal`.
- Sticky table headers → `z-sticky`.
