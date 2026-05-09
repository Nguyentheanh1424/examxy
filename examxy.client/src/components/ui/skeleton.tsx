import type { CSSProperties, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

type SkeletonVariant = 'block' | 'text' | 'avatar' | 'button'

const variantClasses: Record<SkeletonVariant, string> = {
  avatar: 'rounded-full',
  block: 'rounded-[calc(var(--radius-input)-0.25rem)]',
  button: 'h-11 rounded-full',
  text: 'h-4 rounded-full',
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: CSSProperties['height']
  variant?: SkeletonVariant
  width?: CSSProperties['width']
}

export function Skeleton({
  className,
  height,
  style,
  variant = 'block',
  width,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={cn(
        'skeleton-shimmer bg-surface-alt motion-reduce:animate-pulse',
        variantClasses[variant],
        className,
      )}
      style={{ height, width, ...style }}
    />
  )
}
