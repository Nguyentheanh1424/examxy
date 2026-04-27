import { forwardRef } from 'react'
import type { LabelHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        {...props}
        ref={ref}
        className={cn(
          'text-sm font-semibold uppercase tracking-[0.16em] text-brand-strong',
          className,
        )}
      />
    )
  },
)

Label.displayName = 'Label'
