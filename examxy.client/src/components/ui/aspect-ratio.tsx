import type { CSSProperties, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export interface AspectRatioProps extends HTMLAttributes<HTMLDivElement> {
  ratio?: number
}

export function AspectRatio({
  children,
  className,
  ratio = 16 / 9,
  ...props
}: AspectRatioProps) {
  return (
    <div
      {...props}
      className={cn('relative w-full overflow-hidden', className)}
      style={{ ...props.style, paddingBottom: `${100 / ratio}%` } as CSSProperties}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  )
}
