import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-brand text-white shadow-sm hover:bg-brand-strong',
  secondary:
    'border-line bg-surface text-ink hover:border-brand/25 hover:bg-brand-soft/55',
  ghost:
    'border-transparent bg-transparent text-ink hover:bg-brand-soft/50',
  danger:
    'border-transparent bg-danger text-white shadow-sm hover:bg-danger/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
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
        className={cn(
          'focus-ring relative inline-flex items-center justify-center overflow-hidden rounded-full border font-medium tracking-[0.01em] whitespace-nowrap transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none',
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className,
        )}
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
