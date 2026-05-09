import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

type CardShellAccent = 'none' | 'brand' | 'success' | 'warning' | 'danger'
type CardShellPadding = 'none' | 'sm' | 'md' | 'lg'
type CardShellVariant = 'default' | 'flat' | 'subtle' | 'elevated' | 'floating'

const accentClasses: Record<CardShellAccent, string> = {
  brand: 'border-l-4 border-l-brand',
  danger: 'border-l-4 border-l-danger',
  none: '',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
}

const paddingClasses: Record<CardShellPadding, string> = {
  lg: 'p-8',
  md: 'p-6',
  none: '',
  sm: 'p-4',
}

const variantClasses: Record<CardShellVariant, string> = {
  default: 'border border-line/80 bg-panel shadow-[var(--shadow-panel)]',
  elevated: 'border border-line/80 bg-panel shadow-[var(--shadow-elevated)]',
  flat: 'border border-line/80 bg-panel',
  floating: 'border border-white/80 bg-panel shadow-[var(--shadow-floating)]',
  subtle: 'border border-line/70 bg-panel shadow-[var(--shadow-subtle)]',
}

export interface CardShellProps extends HTMLAttributes<HTMLDivElement> {
  accentTone?: CardShellAccent
  interactive?: boolean
  padding?: CardShellPadding
  selected?: boolean
  variant?: CardShellVariant
}

export function CardShell({
  accentTone = 'none',
  children,
  className,
  interactive = false,
  padding = 'none',
  selected = false,
  variant = 'default',
  ...props
}: CardShellProps) {
  return (
    <div
      data-slot="card-shell"
      {...props}
      className={cn(
        'rounded-[var(--radius-panel)]',
        variantClasses[variant],
        paddingClasses[padding],
        accentClasses[accentTone],
        selected && 'ring-2 ring-brand/35 ring-offset-2 ring-offset-background',
        interactive &&
          'transition-[border-color,box-shadow,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[var(--shadow-elevated)] motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </div>
  )
}
