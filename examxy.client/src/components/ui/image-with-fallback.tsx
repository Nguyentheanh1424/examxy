import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function ImageWithFallback({
  alt,
  className,
  src,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [hasError, setHasError] = useState(false)

  return hasError || !src ? (
    <div
      aria-label={alt || 'Image unavailable'}
      className={cn(
        'flex items-center justify-center rounded-[calc(var(--radius-panel)-0.5rem)] border border-dashed border-line bg-surface-alt px-4 py-6 text-sm text-muted',
        className,
      )}
      role="img"
    >
      {alt || 'Image unavailable'}
    </div>
  ) : (
    <img
      {...props}
      alt={alt}
      className={className}
      onError={() => {
        setHasError(true)
      }}
      src={src}
    />
  )
}
