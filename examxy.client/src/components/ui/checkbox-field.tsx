import type { InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef, useId } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export interface CheckboxFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  hint?: string
  error?: string
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ className, error, hint, id, label, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const hintId = hint ? `${inputId}-hint` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className={cn('space-y-2', className)}>
        <label className="flex items-start gap-3" htmlFor={inputId}>
          <span className="relative mt-0.5 inline-flex shrink-0 items-center justify-center">
            <input
              {...props}
              ref={ref}
              aria-describedby={describedBy}
              aria-label={typeof label === 'string' ? label : undefined}
              aria-invalid={Boolean(error)}
              className="peer sr-only"
              id={inputId}
              type="checkbox"
            />
            <span
              className={cn(
                'flex size-5 items-center justify-center rounded-md border bg-surface text-white shadow-sm transition',
                error
                  ? 'border-danger/65 bg-danger-soft/70'
                  : 'border-line peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-focus/25',
              )}
            >
              <Check className="size-3.5 opacity-0 transition peer-checked:opacity-100" />
            </span>
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-base font-medium text-ink">{label}</span>

            {hint ? (
              <span className="mt-1 block text-base leading-relaxed text-muted" id={hintId}>
                {hint}
              </span>
            ) : null}
          </span>
        </label>

        {error ? (
          <p className="text-base font-medium leading-relaxed text-danger" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)

CheckboxField.displayName = 'CheckboxField'
