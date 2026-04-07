# AGENTS.md - Examxy AI Coding Rules

## Priority order

1. EDS v2.3 is the immutable design source of truth.
2. `AI_AGENT_PROJECT_GUIDE.md` is the implementation and governance guide.
3. Existing repo patterns win over ad-hoc invention.

## Non-negotiable rules

- Do not redefine the design language.
- Reuse existing component patterns before creating new ones.
- Extend with variants or slots before adding new components.
- Do not hard-code colors, typography, spacing, motion, radii or shadows if tokens already exist.
- Keep mobile touch targets at or above 44px.
- Keep body text at or above 16px on mobile.
- Use Lucide icons only unless explicitly approved otherwise.
- Respect reduced motion.
- Do not use color as the only status signal.
- Every shared UI change must update code, types, tests, docs and usage sites.

## Required workflow before coding

1. Read the relevant existing component, token, type and docs.
2. Audit whether the change can be solved by reusing an existing component.
3. Identify all affected layers: UI, types, tests, docs, accessibility, copy, responsive behavior.
4. Implement the smallest valid change.
5. Review for duplication and design drift.

## Required workflow after coding

- Verify the component still matches EDS.
- Verify states: default, hover, focus-visible, active, disabled, loading, error/success when relevant.
- Verify accessibility and keyboard usage.
- Verify responsive behavior and hitbox size.
- Update tests and docs.
- Update all impacted call sites.

## Source-of-truth map

- Color tokens: `src/styles/tokens.css` or `globals.css`
- Tailwind theme: `tailwind.config.js/ts`
- Shared primitives: `src/components/ui/*`
- Feature UI: `src/features/*/components/*`
- Shared domain types: `src/types/*`
- Shared copy/constants: `src/constants/*`
- Engineering docs: `docs/*`

## Component rules

### Button
- Use one canonical Button component.
- Support variants and loading without layout shift.
- Keep active press feedback and focus ring.

### Text Field
- Keep one canonical input family.
- Error state must include text, not only color.
- Search variant includes leading search icon.

### Multiple Choice Option
- Whole card is clickable.
- Single and multiple variants stay within one component family.
- Correct and wrong states use semantic status mapping.

### Data Table
- Sticky header for long lists.
- Text aligns left, numbers align right.
- Sorting and selection patterns must stay unified.

### OMR Scanner Viewfinder
- Keep searching, processing, success and error states explicit.
- Keep scanner motion and success feedback consistent.

## Naming rules

- One meaning, one prop name.
- Prefer: `variant`, `size`, `status`, `disabled`, `isLoading`, `error`, `hint`, `leftIcon`, `rightIcon`.
- Avoid ambiguous names such as `helper`, `manager`, `common`, `wrapper2`.

## Done means

A task is not done unless:

- it is compliant with EDS;
- it introduces no redundant pattern;
- types/tests/docs are updated;
- accessibility is preserved;
- responsive behavior is preserved;
- all affected usage sites are updated.
