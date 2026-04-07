import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function CardShell({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-[var(--radius-panel)] border border-line/80 bg-panel shadow-[var(--shadow-panel)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
