# EDS v3.0 — Motion, Animation & Icons

## Custom Easings

```js
transitionTimingFunction: {
  'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',   // Most transitions
  'entrance':  'cubic-bezier(0, 0, 0.2, 1)',      // Elements entering the screen
  'exit':      'cubic-bezier(0.4, 0, 1, 1)',      // Elements leaving the screen
  'spring':    'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Playful/bouncy
},
transitionDuration: {
  'fast':   '100ms',  // Hover, focus ring
  'normal': '200ms',  // Most transitions
  'slow':   '350ms',  // Complex transitions
  'xslow':  '500ms',  // Page-level transitions
},
```

## Keyframes & Animations

```js
keyframes: {
  'scanner-breathe': {
    '0%, 100%': { transform: 'scale(1)', borderColor: 'oklch(0.65 0.15 146 / 0.4)' },
    '50%':      { transform: 'scale(1.02)', borderColor: 'oklch(0.65 0.15 146 / 1)' },
  },
  'skeleton-shimmer': {
    '0%':   { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  'toast-in': {
    '0%':   { transform: 'translateY(100%) scale(0.95)', opacity: '0' },
    '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
  },
  'toast-out': {
    '0%':   { transform: 'translateY(0) scale(1)', opacity: '1' },
    '100%': { transform: 'translateY(100%) scale(0.95)', opacity: '0' },
  },
  'shake': {
    '0%, 100%': { transform: 'translateX(0)' },
    '20%':      { transform: 'translateX(-6px)' },
    '40%':      { transform: 'translateX(6px)' },
    '60%':      { transform: 'translateX(-4px)' },
    '80%':      { transform: 'translateX(4px)' },
  },
  'fade-in': {
    '0%':   { opacity: '0' },
    '100%': { opacity: '1' },
  },
  'slide-up': {
    '0%':   { transform: 'translateY(8px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
},
animation: {
  'scanner-breathe':  'scanner-breathe 2s cubic-bezier(0.4,0,0.2,1) infinite',
  'skeleton-shimmer': 'skeleton-shimmer 1.5s linear infinite',
  'toast-in':         'toast-in 250ms cubic-bezier(0,0,0.2,1) forwards',
  'toast-out':        'toast-out 200ms cubic-bezier(0.4,0,1,1) forwards',
  'shake':            'shake 300ms cubic-bezier(0.4,0,0.2,1)',
  'fade-in':          'fade-in 200ms cubic-bezier(0,0,0.2,1)',
  'slide-up':         'slide-up 200ms cubic-bezier(0,0,0.2,1)',
},
```

## Reduced Motion (Required Implementation)

### Global CSS

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .animate-skeleton-shimmer {
    animation: none !important;
    opacity: 0.7;
  }

  .animate-scanner-breathe {
    animation: none !important;
    transform: none !important;
  }
}
```

### React Hook

```js
const usePrefersReducedMotion = () => {
  const [prefersReduced, setPrefersReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    mq.addEventListener("change", (e) => setPrefersReduced(e.matches));
  }, []);
  return prefersReduced;
};
```

---

## Icon Contract

- **Library**: Lucide Icons (React components only — no SVG imports)
- **Canvas**: 24×24px
- **Stroke**: 2px; never use fill except for status icons (success, error)
- **Corner & Cap**: Round joins + Round caps
- **Padding**: Minimum 1px inside canvas

### Standard Icon Component

```jsx
import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";

// Decorative icon
const Icon = ({ icon: Ico, size = 20, className = "" }) => (
  <Ico size={size} strokeWidth={2} className={className} aria-hidden="true" />
);

// Status icon (uses fill for solid feel)
const StatusIcon = ({ status }) => {
  const map = {
    success: (
      <CheckCircle2
        size={20}
        strokeWidth={0}
        fill="oklch(var(--color-success))"
      />
    ),
    error: (
      <XCircle size={20} strokeWidth={0} fill="oklch(var(--color-error))" />
    ),
    warning: (
      <AlertTriangle size={20} strokeWidth={2} className="text-warning" />
    ),
    info: <Info size={20} strokeWidth={2} className="text-info" />,
  };
  return map[status] ?? null;
};
```

### Icon Accessibility Rules

- Decorative icons (have adjacent label text) → `aria-hidden="true"`
- Meaningful icons (no visible label) → `aria-label="descriptive text"`
- Never change `strokeWidth` from `2`.
