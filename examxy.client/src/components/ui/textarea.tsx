import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, rows = 4, ...props }, ref) => {
  return (
    <textarea
      {...props}
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-base text-ink outline-none transition placeholder:text-muted/80 hover:border-brand/25 focus:border-brand focus:ring-4 focus:ring-focus/25 motion-reduce:transition-none',
        className,
      )}
      rows={rows}
    />
  )
})

Textarea.displayName = 'Textarea'
