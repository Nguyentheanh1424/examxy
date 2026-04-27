import type { HTMLAttributes } from 'react'

import { Notice } from '@/components/ui/notice'
import { cn } from '@/lib/utils/cn'

export function Alert({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn('w-full', className)}>
      {children}
    </div>
  )
}

export function AlertTitle({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn('text-sm font-semibold text-ink', className)}
    />
  )
}

export function AlertDescription({
  children,
  className,
  tone = 'info',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: 'info' | 'success' | 'warning' | 'error'
}) {
  return (
    <Notice {...props} className={className} tone={tone}>
      {children}
    </Notice>
  )
}
