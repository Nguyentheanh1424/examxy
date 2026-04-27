import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  className?: string
  label?: string
  size?: number
}

export function Spinner({
  className,
  label = 'Loading',
  size = 16,
}: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <LoaderCircle
        aria-label={label}
        className="animate-spin motion-reduce:animate-none"
        role="status"
        style={{ height: size, width: size }}
      />
    </span>
  )
}
