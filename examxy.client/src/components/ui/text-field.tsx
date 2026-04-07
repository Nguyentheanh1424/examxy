import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef, useId } from 'react'

import { cn } from '@/lib/utils/cn'

export interface TextFieldProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  labelAction?: ReactNode
  hint?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  rightIconLabel?: string
  onRightIconClick?: () => void
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      error,
      hint,
      id,
      label,
      labelAction,
      leftIcon,
      onRightIconClick,
      rightIcon,
      rightIconLabel,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            className="block text-base font-medium tracking-[0.01em] text-ink"
            htmlFor={inputId}
          >
            {label}
          </label>

          {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
        </div>

        <div
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-[var(--radius-input)] border bg-surface px-4 transition duration-200 motion-reduce:transition-none',
            error
              ? 'border-danger/65 bg-danger-soft/60'
              : 'border-line hover:border-brand/25 focus-within:border-brand focus-within:ring-4 focus-within:ring-focus/25',
          )}
        >
          {leftIcon ? (
            <span aria-hidden="true" className="shrink-0 text-muted">
              {leftIcon}
            </span>
          ) : null}

          <input
            {...props}
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            className="w-full min-w-0 border-0 bg-transparent py-3 text-base text-ink outline-none placeholder:text-muted/80"
            id={inputId}
          />

          {rightIcon ? (
            onRightIconClick ? (
              <button
                aria-label={rightIconLabel ?? 'Field action'}
                className="focus-ring shrink-0 rounded-full p-1 text-muted transition hover:text-ink"
                onClick={onRightIconClick}
                type="button"
              >
                {rightIcon}
              </button>
            ) : (
              <span aria-hidden="true" className="shrink-0 text-muted">
                {rightIcon}
              </span>
            )
          ) : null}
        </div>

        {hint ? (
          <p className="text-base leading-relaxed text-muted" id={hintId}>
            {hint}
          </p>
        ) : null}

        {error ? (
          <p className="text-base font-medium leading-relaxed text-danger" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

TextField.displayName = 'TextField'
