# EXAMXY DESIGN SYSTEM (EDS) v3.0 — File Index

> AI Agent entry point. Load only the files relevant to your task.

## File Map

| File                              | Contents                                                         | Load when…                                |
| --------------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| `01-tokens-colors.md`             | CSS variables, dark mode, Tailwind color config, usage rules     | Styling any element with color            |
| `02-tokens-typography-spacing.md` | Font stack, type scale, spacing tokens, radius tokens, z-index   | Sizing, spacing, or text styling          |
| `03-layout-breakpoints.md`        | Grid system, breakpoints, touch targets, Bento Grid rules        | Building layouts or responsive components |
| `04-motion-icons.md`              | Easings, keyframes, animations, reduced-motion, icon contract    | Adding animation or icons                 |
| `05-components-button-input.md`   | Button, TextField specs (variants, states, code)                 | Building forms or action triggers         |
| `06-components-data-display.md`   | DataTable, Badge/Tag, Avatar, Pagination, Tabs specs             | Displaying lists or tabular data          |
| `07-components-overlay.md`        | Modal, Dropdown/Select, Toast specs                              | Overlay UI                                |
| `08-components-feedback.md`       | Skeleton Loader, Empty State, OMR Scanner Viewfinder             | Loading & empty states                    |
| `09-components-layout.md`         | AuthEdgeLayout spec                                              | Authentication pages                      |
| `10-forms-validation.md`          | Validation strategy, error messages, hook pattern, rules library | Any form with validation                  |
| `11-dark-mode.md`                 | Per-component dark mode rules, `dark:` modifier guide, checklist | Dark mode implementation                  |
| `12-accessibility.md`             | WCAG 2.2, ARIA patterns, keyboard navigation                     | Any interactive component                 |
| `13-copywriting.md`               | Tone of voice, copy patterns, words to avoid                     | Writing UI text                           |
| `14-contribution.md`              | Checklist, process, "extend before create" principle             | Adding new components                     |

## Core Invariants (Always Apply)

- Shared frontend UI must ship from `examxy.client/src/components/ui/*`; temporary reference trees must be merged or removed before completion.

- **Never** use hardcoded hex/rgb colors — use design tokens only.
- **Never** create ad-hoc styles when a shared token or component already exists.
- Mobile touch targets **≥ 44px** on all interactive elements.
- Body text **≥ 16px** on mobile.
- Icons: **Lucide only**, `strokeWidth={2}`, `aria-hidden="true"` on decorative icons.
- Color must **never** be the sole means of conveying information — always pair with icon + text.
- Reduced motion: all animations must respect `prefers-reduced-motion`.
