import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      className={cn(
        'animate-pulse rounded-[calc(var(--radius-input)-0.25rem)] bg-surface-alt',
        className,
      )}
    />
  )
}
