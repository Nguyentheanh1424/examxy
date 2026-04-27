import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export const Slider = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
>(({ className, ...props }, ref) => {
  return (
    <input
      {...props}
      className={cn('w-full accent-[var(--color-brand)]', className)}
      ref={ref}
      type="range"
    />
  )
})

Slider.displayName = 'Slider'
