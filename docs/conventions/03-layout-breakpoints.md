# EDS v3.0 — Layout, Breakpoints & Bento Grid

## Breakpoints

```js
screens: {
  'sm':  '640px',
  'md':  '768px',
  'lg':  '1024px',
  'xl':  '1280px',
  '2xl': '1536px',
}
```

## Layout Rules by Breakpoint

| Breakpoint       | Grid        | Sidebar                  | Navigation            |
| ---------------- | ----------- | ------------------------ | --------------------- |
| `< sm` (< 640px) | 1 column    | Hidden — use Bottom Nav  | Bottom Navigation Bar |
| `sm – md`        | 1–2 columns | Drawer (slide from left) | Top bar + Hamburger   |
| `md – lg`        | 2–3 columns | Drawer or collapsed      | Full top bar          |
| `≥ lg`           | 3–4 columns | Fixed sidebar 240px      | Top bar + Sidebar     |

## Touch Target Rules

- All interactive elements on `< md`: minimum **44 × 44px**.
- Tailwind: use `min-h-[44px] md:min-h-[40px]`.
- Visual size does not need to be 44px — invisible padding is acceptable to reach this size.

---

## Bento Grid

### Basic Structure

```html
<main
  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-8"
>
  <!-- Standard card -->
  <div
    class="p-6 bg-background-surface rounded-[var(--radius-panel)] border border-border shadow-sm"
  >
    ...
  </div>

  <!-- Wide card spanning 2 columns -->
  <div
    class="md:col-span-2 p-6 bg-background-surface rounded-[var(--radius-panel)] border border-border shadow-sm"
  >
    ...
  </div>
</main>
```

### Card Height Rules

| Card type                         | Rule                                     | Tailwind                        |
| --------------------------------- | ---------------------------------------- | ------------------------------- |
| Default (all cards in a row)      | Same height via stretch                  | `items-stretch` on grid         |
| Single metric card (1 big number) | Minimum height to avoid looking too thin | `min-h-[160px]`                 |
| Chart card                        | Fixed height                             | `h-[300px] md:h-[360px]`        |
| List card                         | Scrollable, capped height                | `max-h-[400px] overflow-y-auto` |

> ⚠️ **Do not mix** `auto`-height cards with fixed-height cards in the same row — this causes misaligned layouts.

### Height Example

```html
<!-- Row with mixed metric + chart: keep them in separate rows or use items-stretch -->
<div class="grid grid-cols-3 gap-6 items-stretch">
  <div class="min-h-[160px] ...">Metric card</div>
  <div class="col-span-2 ...">Chart card — stretches to match</div>
</div>

<!-- Full-width chart row (no mixing issue) -->
<div class="grid grid-cols-3 gap-6">
  <div class="col-span-3 h-[320px] ...">Full-width chart</div>
</div>
```
