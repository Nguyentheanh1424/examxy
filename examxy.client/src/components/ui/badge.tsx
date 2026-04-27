/* eslint-disable react-refresh/only-export-components */

import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'soft' | 'solid' | 'outline'
type BadgeTone =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral'

const toneClasses: Record<BadgeVariant, Record<BadgeTone, string>> = {
  soft: {
    primary: 'bg-brand-soft text-brand-strong',
    success: 'bg-success-soft text-success',
    error: 'bg-danger-soft text-danger',
    warning: 'bg-warning-soft text-ink',
    info: 'bg-brand-soft/80 text-brand-strong',
    neutral: 'bg-surface-alt text-muted',
  },
  solid: {
    primary: 'bg-brand text-white',
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-ink',
    info: 'bg-brand-strong text-white',
    neutral: 'bg-muted text-white',
  },
  outline: {
    primary: 'border border-brand/30 text-brand-strong',
    success: 'border border-success/35 text-success',
    error: 'border border-danger/35 text-danger',
    warning: 'border border-warning/35 text-ink',
    info: 'border border-brand/25 text-brand-strong',
    neutral: 'border border-line text-muted',
  },
}

const sizeClasses = {
  sm: 'min-h-5 px-2 text-[0.7rem]',
  md: 'min-h-6 px-2.5 text-xs',
} as const

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  tone?: BadgeTone
  color?: BadgeTone
  size?: keyof typeof sizeClasses
  dot?: boolean
}

export function badgeVariants(options?: {
  className?: string
  variant?: BadgeVariant
  tone?: BadgeTone
  color?: BadgeTone
  size?: keyof typeof sizeClasses
}) {
  const {
    className,
    color,
    size = 'md',
    tone = 'neutral',
    variant = 'soft',
  } = options ?? {}

  const resolvedTone = color ?? tone

  return cn(
    'inline-flex items-center justify-center gap-1 rounded-full font-semibold uppercase tracking-[0.14em]',
    sizeClasses[size],
    toneClasses[variant][resolvedTone],
    className,
  )
}

export function Badge({
  children,
  className,
  color,
  dot = false,
  size = 'md',
  tone = 'neutral',
  variant = 'soft',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={badgeVariants({ className, color, size, tone, variant })}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
