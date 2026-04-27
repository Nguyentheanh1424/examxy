import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function ResizablePanelGroup({
  className,
  direction = 'horizontal',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  direction?: 'horizontal' | 'vertical'
}) {
  return (
    <div
      {...props}
      className={cn(
        'flex min-h-0 min-w-0',
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        className,
      )}
    />
  )
}

export function ResizablePanel({
  className,
  defaultSize,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  defaultSize?: number
}) {
  return (
    <div
      {...props}
      className={cn('min-h-0 min-w-0 flex-1', className)}
      style={{
        ...style,
        flexBasis: defaultSize ? `${defaultSize}%` : undefined,
      }}
    />
  )
}

export function ResizableHandle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('shrink-0 bg-line/80', className)} />
}
