import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  return (
    <label className={cn('relative inline-flex size-5 shrink-0 cursor-pointer items-center justify-center', className)}>
      <input
        {...props}
        ref={ref}
        className="peer sr-only"
        type="checkbox"
      />
      <span className="flex size-5 items-center justify-center rounded-md border border-line bg-surface text-white shadow-sm transition peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-focus/25">
        <Check className="size-3.5 opacity-0 transition peer-checked:opacity-100" />
      </span>
    </label>
  )
})

Checkbox.displayName = 'Checkbox'
