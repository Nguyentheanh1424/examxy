# EDS v3.0 — Accessibility (WCAG 2.2)

## P.O.U.R. Principles

| Principle          | Requirements                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Perceivable**    | Contrast ≥ 4.5:1 (text), 3:1 (UI/icons). Never use color alone to convey meaning. Alt text on images.                  |
| **Operable**       | Logical tab order. Clearly visible focus state. Touch targets ≥ 44px. No focus traps (except intentional modal traps). |
| **Understandable** | Clear error messages with specific guidance. Full labels on all form fields.                                           |
| **Robust**         | Semantic HTML elements. Correct ARIA roles. Test with screen reader.                                                   |

## ARIA Patterns

```jsx
// Modal / Dialog
<div role="dialog" aria-modal="true" aria-labelledby="title-id" aria-describedby="desc-id">

// Loading button
<button aria-busy="true" aria-label="Processing…">

// Invalid input + error message
<input aria-invalid="true" aria-describedby="error-msg-id" />
<p id="error-msg-id" role="alert">{errorMessage}</p>

// Sortable table header
<th aria-sort="ascending">Student Name</th>

// Tab group
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">…</div>

// Icon-only button (no visible label)
<button aria-label="Delete student Nguyen Van A">
  <Trash2 size={16} aria-hidden="true" />
</button>

// Live region for dynamic updates (e.g. scanner state)
<div aria-live="polite" aria-atomic="true">{statusMessage}</div>

// Loading skeleton container
<div aria-busy="true" aria-label="Loading student list…">
  <TableRowSkeleton columns={4} />
</div>
```

## Keyboard Navigation Requirements

| Component           | Required Keys                                                   |
| ------------------- | --------------------------------------------------------------- |
| Modal               | `Escape` → close; `Tab` / `Shift+Tab` → cycle within focus trap |
| Dropdown            | `Arrow Up/Down` → navigate; `Enter` → select; `Escape` → close  |
| Tabs                | `Arrow Left/Right` → switch tab                                 |
| DataTable           | `Space` → select row; `Enter` → expand (if expandable)          |
| MC Options          | `Arrow` keys → move; `Space` → select                           |
| Toast (dismissable) | `Escape` or visible close button                                |

## Focus Visible Style

All interactive elements must show a clearly visible focus ring. Use the canonical pattern:

```html
focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-primary-500
```

Never use `outline: none` without providing an alternative visible focus indicator.

## Contrast Minimum Requirements

| Element                            | Minimum ratio                                |
| ---------------------------------- | -------------------------------------------- |
| Body text                          | 4.5:1                                        |
| Large text (≥ 18px bold or ≥ 24px) | 3:1                                          |
| UI components & icons              | 3:1                                          |
| Disabled elements                  | Exempt (but should still be distinguishable) |
| Focus indicators                   | 3:1 against adjacent colors                  |
