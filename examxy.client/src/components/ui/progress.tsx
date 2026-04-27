import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number
}

export function Progress({
  className,
  value = 0,
  ...props
}: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div
      {...props}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={safeValue}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-alt', className)}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-200 motion-reduce:transition-none"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}
