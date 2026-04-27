/* eslint-disable react-refresh/only-export-components */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'outline'
  | 'success'
  | 'link'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-brand text-white shadow-sm hover:bg-brand-strong',
  secondary:
    'border-line bg-surface text-ink hover:border-brand/25 hover:bg-brand-soft/55',
  ghost:
    'border-transparent bg-transparent text-ink hover:bg-brand-soft/50',
  danger:
    'border-transparent bg-danger text-white shadow-sm hover:bg-danger/90',
  outline:
    'border-line bg-white/70 text-ink shadow-sm hover:border-brand/30 hover:bg-brand-soft/45',
  success:
    'border-transparent bg-success text-white shadow-sm hover:bg-success/90',
  link:
    'border-transparent bg-transparent px-0 text-brand-strong underline-offset-4 hover:text-brand hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
  icon: 'size-11 p-0',
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export function buttonVariants(options?: {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}) {
  const {
    className,
    fullWidth = false,
    size = 'md',
    variant = 'primary',
  } = options ?? {}

  return cn(
    'focus-ring relative inline-flex items-center justify-center overflow-hidden border font-medium tracking-[0.01em] whitespace-nowrap transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none',
    variant === 'link' ? 'rounded-none' : size === 'icon' ? 'rounded-full' : 'rounded-full',
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && 'w-full',
    className,
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      size = 'md',
      variant = 'primary',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        {...props}
        ref={ref}
        className={buttonVariants({ className, fullWidth, size, variant })}
        disabled={disabled || isLoading}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center gap-2',
            isLoading && 'opacity-0',
          )}
        >
          {leftIcon ? <span aria-hidden="true">{leftIcon}</span> : null}
          <span>{children}</span>
          {rightIcon ? <span aria-hidden="true">{rightIcon}</span> : null}
        </span>

        {isLoading ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner className="text-current" />
          </span>
        ) : null}
      </button>
    )
  },
)

Button.displayName = 'Button'
