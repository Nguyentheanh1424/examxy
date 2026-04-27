import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        {...props}
        ref={ref}
        className={cn(
          'min-h-11 w-full rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition placeholder:text-muted/80 hover:border-brand/25 focus:border-brand focus:ring-4 focus:ring-focus/25 motion-reduce:transition-none',
          className,
        )}
      />
    )
  },
)

Input.displayName = 'Input'
