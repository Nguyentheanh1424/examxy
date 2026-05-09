import type { HTMLAttributes } from 'react'

import { CardShell, type CardShellProps } from '@/components/ui/card-shell'
import { cn } from '@/lib/utils/cn'

export function Card({
  className,
  ...props
}: CardShellProps) {
  return <CardShell {...props} className={cn('overflow-hidden', className)} />
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('grid gap-2 px-6 py-6 sm:px-7', className)}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn('text-xl font-semibold tracking-[-0.03em] text-ink', className)}
    />
  )
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn('text-sm leading-6 text-muted', className)}
    />
  )
}

export function CardAction({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('ml-auto flex items-center gap-2', className)}
    />
  )
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-6 pb-6 sm:px-7', className)} />
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('flex items-center gap-3 px-6 pb-6 sm:px-7', className)}
    />
  )
}
