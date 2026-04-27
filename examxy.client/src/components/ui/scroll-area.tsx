import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function ScrollArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('overflow-auto', className)} />
}

export function ScrollBar({ className, orientation = 'vertical', ...props }: HTMLAttributes<HTMLDivElement> & { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-full bg-line/80',
        orientation === 'vertical' ? 'h-full w-1.5' : 'h-1.5 w-full',
        className,
      )}
    />
  )
}
