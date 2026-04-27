import type { HTMLAttributes, ImgHTMLAttributes } from 'react'
import { createContext, useContext } from 'react'

import { cn } from '@/lib/utils/cn'

interface AvatarContextValue {
  sizeClass: string
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
}

export function Avatar({
  children,
  className,
  size = 'md',
  ...props
}: AvatarProps) {
  const sizeClass = avatarSizeClasses[size]

  return (
    <AvatarContext.Provider value={{ sizeClass }}>
      <div
        {...props}
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line/80 bg-brand-soft text-brand-strong shadow-sm',
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
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const { sizeClass } = useContext(AvatarContext)

  return (
    <img
      {...props}
      alt={alt}
      className={cn('h-full w-full object-cover', sizeClass, className)}
    />
  )
}

export function AvatarFallback({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
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
