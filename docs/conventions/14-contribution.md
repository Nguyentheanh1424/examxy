# EDS v3.0 — Contribution Process

## "Extend Before Create" Decision Tree

Before creating a new component, answer these questions in order:

1. **Variant** — Can an existing component solve this with a new `variant` prop?
2. **Slot** — Can an existing component accept `children` or a slot prop to render custom content?
3. **Composition** — Can this be built by composing 2+ existing smaller components?
4. **New** — Only create a new component if all 3 above are "No".

## 3-Step Process

### Step 1 — Frame the Problem (not the solution)

Start from real user need, not from a visual idea.

> ✅ "We need to show a critical error that requires immediate attention"
> ❌ "We need a big red notification box"

### Step 2 — Audit the System

- Does an existing component already solve this?
- Can it be solved with a variant or slot?
- Is the new concept versatile enough to be used in 3+ places?

### Step 3 — Proposal & PR

Issue / MR must include:

- Problem statement
- Alternatives considered
- Whether you need review or will implement independently
- Full documentation (see checklist below)

## Component Documentation Requirements

Every new component must document:

- **Anatomy** — breakdown of all sub-parts
- **Variants** — full list with when to use each
- **Props table** — name, type, default, description
- **States** — all interactive and loading states
- **Behavior** — animations, keyboard, focus management
- **Code sample** — working JSX

## Pre-Merge Checklist

```
☐ Documentation complete (anatomy, props, states, behavior, code sample)
☐ Working code sample included
☐ Dark mode tested
☐ Mobile tested (< 768px), touch targets ≥ 44px verified
☐ ARIA attributes added correctly
☐ Keyboard navigation implemented and tested
☐ prefers-reduced-motion handled
☐ Contrast ratio meets WCAG 2.2 AA in both light and dark mode
☐ Added to Storybook / Component Gallery
☐ CHANGELOG updated
☐ No hardcoded colors (hex/rgb/hsl)
☐ No arbitrary z-index values outside the layer system
☐ Uses existing spacing tokens (no arbitrary px values)
```

## Governance

- Changes to **shared tokens or shared UI contracts** → update code, all usage sites, tests, and affected docs simultaneously.
- Changes to **agent/AI governance rules** → update `AI_AGENT_PROJECT_GUIDE.md`.
- New canonical shared UI concept → update the nearest `AGENTS.md` and `docs/conventions/frontend-source-of-truth.md`.
