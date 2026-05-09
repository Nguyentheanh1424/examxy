import type { HTMLAttributes, ImgHTMLAttributes } from 'react'
import { createContext, useContext, useState } from 'react'

import { cn } from '@/lib/utils/cn'

interface AvatarContextValue {
  sizeClass: string
  imageLoaded?: boolean
  setImageLoaded?: (loaded: boolean) => void
}

const AvatarContext = createContext<AvatarContextValue>({
  sizeClass: 'size-10',
})

const avatarSizeClasses = {
  sm: 'size-9 text-sm',
  md: 'size-10 text-base',
  lg: 'size-12 text-lg',
} as const

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof avatarSizeClasses
  noBorder?: boolean
}

export function Avatar({
  children,
  className,
  size = 'md',
  noBorder = false,
  ...props
}: AvatarProps) {
  const sizeClass = avatarSizeClasses[size]
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <AvatarContext.Provider value={{ sizeClass, imageLoaded, setImageLoaded }}>
      <div
        {...props}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-brand-strong',
          !noBorder && 'border border-line/80 shadow-sm',
          sizeClass,
          className,
        )}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  )
}

export function AvatarImage({
  alt,
  className,
  onLoad,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const { setImageLoaded } = useContext(AvatarContext)
  const [hasError, setHasError] = useState(false)

  return (
    <img
      {...props}
      alt={alt}
      className={cn(
        'h-full w-full object-cover transition-opacity duration-300',
        hasError ? 'hidden' : 'opacity-100',
        className
      )}
      onLoad={(e) => {
        setImageLoaded?.(true)
        onLoad?.(e)
      }}
      onError={(e) => {
        setHasError(true)
        setImageLoaded?.(false)
        onError?.(e)
      }}
    />
  )
}

export function AvatarFallback({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const { imageLoaded } = useContext(AvatarContext)

  if (imageLoaded) return null

  return (
    <span
      {...props}
      className={cn(
        'flex h-full w-full items-center justify-center font-semibold uppercase tracking-[0.08em]',
        className,
      )}
    >
      {children}
    </span>
  )
}
