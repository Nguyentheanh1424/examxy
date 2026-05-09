import type { AnchorHTMLAttributes, HTMLAttributes, OlHTMLAttributes } from 'react'
import { ChevronRight, MoreHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils/cn'

export function Breadcrumb({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <nav {...props} aria-label="Điều hướng" className={cn('w-full', className)} />
}

export function BreadcrumbList({
  className,
  ...props
}: OlHTMLAttributes<HTMLOListElement>) {
  return <ol {...props} className={cn('flex flex-wrap items-center gap-1.5 text-sm text-muted', className)} />
}

export function BreadcrumbItem({
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={cn('inline-flex items-center gap-1.5', className)} />
}

export function BreadcrumbLink({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={cn('transition hover:text-ink', className)} />
}

export function BreadcrumbPage({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} aria-current="page" className={cn('font-medium text-ink', className)} />
}

export function BreadcrumbSeparator({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...props}
      aria-hidden="true"
      className={cn('text-muted [&>svg]:size-3.5', className)}
      role="presentation"
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

export function BreadcrumbEllipsis({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cn('inline-flex size-8 items-center justify-center text-muted', className)}
      role="presentation"
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">Thêm</span>
    </span>
  )
}
