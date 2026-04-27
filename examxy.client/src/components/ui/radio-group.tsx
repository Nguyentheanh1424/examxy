import type { HTMLAttributes, InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function RadioGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-3', className)} role="radiogroup" />
}

export function RadioGroupItem({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-3', className)}>
      <input {...props} className="peer sr-only" type="radio" />
      <span className="flex size-5 items-center justify-center rounded-full border border-line bg-surface shadow-sm transition peer-checked:border-brand peer-focus-visible:ring-4 peer-focus-visible:ring-focus/25">
        <span className="size-2.5 rounded-full bg-brand opacity-0 transition peer-checked:opacity-100" />
      </span>
    </label>
  )
}
