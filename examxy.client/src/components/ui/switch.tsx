import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export const Switch = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  return (
    <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
      <input
        {...props}
        ref={ref}
        className="peer sr-only"
        type="checkbox"
      />
      <span className="relative h-6 w-11 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-focus/25">
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
    </label>
  )
})

Switch.displayName = 'Switch'
