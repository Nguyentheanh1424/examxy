import type { ReactNode, SelectHTMLAttributes } from 'react'
import { useId } from 'react'

interface AssessmentSelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  labelAction?: ReactNode
}

export function AssessmentSelectField({
  children,
  className,
  hint,
  id,
  label,
  labelAction,
  ...props
}: AssessmentSelectFieldProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const hintId = hint ? `${selectId}-hint` : undefined

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label
            className="block text-base font-medium tracking-[0.01em] text-ink"
            htmlFor={selectId}
          >
            {label}
          </label>
          {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
        </div>
        <select
          {...props}
          className="min-h-11 w-full rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition hover:border-brand/25 focus:border-brand focus:ring-4 focus:ring-focus/25"
          id={selectId}
        >
          {children}
        </select>
        {hint ? (
          <p className="text-base leading-relaxed text-muted" id={hintId}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}
