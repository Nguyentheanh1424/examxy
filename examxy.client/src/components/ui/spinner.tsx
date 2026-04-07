import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

interface SpinnerProps {
  className?: string
  label?: string
}

export function Spinner({
  className,
  label = 'Loading',
}: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <LoaderCircle
        aria-label={label}
        className="size-4 animate-spin motion-reduce:animate-none"
        role="status"
      />
    </span>
  )
}
