/* eslint-disable react-refresh/only-export-components */

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

type ToggleVariant = 'default' | 'outline'
type ToggleSize = 'sm' | 'default' | 'lg'

const toggleVariantClasses: Record<ToggleVariant, string> = {
  default: 'bg-surface-alt text-muted hover:text-ink data-[state=on]:bg-brand-soft data-[state=on]:text-brand-strong',
  outline: 'border border-line bg-transparent text-muted hover:border-brand/25 hover:text-ink data-[state=on]:border-brand/35 data-[state=on]:bg-brand-soft/70 data-[state=on]:text-brand-strong',
}

const toggleSizeClasses: Record<ToggleSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  default: 'min-h-10 px-4 text-sm',
  lg: 'min-h-11 px-5 text-base',
}

export function toggleVariants(options?: {
  className?: string
  pressed?: boolean
  size?: ToggleSize
  variant?: ToggleVariant
}) {
  const {
    className,
    pressed = false,
    size = 'default',
    variant = 'default',
  } = options ?? {}

  return cn(
    'inline-flex items-center justify-center rounded-full font-medium transition',
    toggleVariantClasses[variant],
    toggleSizeClasses[size],
    pressed && 'ring-2 ring-focus/25',
    className,
  )
}

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean
  size?: ToggleSize
  variant?: ToggleVariant
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed = false, size = 'default', variant = 'default', ...props }, ref) => {
    return (
      <button
        {...props}
        ref={ref}
        aria-pressed={pressed}
        className={toggleVariants({ className, pressed, size, variant })}
        data-state={pressed ? 'on' : 'off'}
        type={props.type ?? 'button'}
      />
    )
  },
)

Toggle.displayName = 'Toggle'
