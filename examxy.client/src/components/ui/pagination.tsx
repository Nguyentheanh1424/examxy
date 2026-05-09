import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import type { AnchorHTMLAttributes, HTMLAttributes } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

export function Pagination({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav {...props} aria-label="Phân trang" className={cn('w-full', className)} />
}

export function PaginationContent({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul {...props} className={cn('flex flex-wrap items-center gap-2', className)} />
}

export function PaginationItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={className} />
}

export interface PaginationLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PaginationLink({
  className,
  isActive = false,
  size = 'md',
  ...props
}: PaginationLinkProps) {
  return (
    <a
      {...props}
      aria-current={isActive ? 'page' : undefined}
      className={buttonVariants({
        className,
        size,
        variant: isActive ? 'primary' : 'secondary',
      })}
    />
  )
}

export function PaginationPrevious({
  children = 'Trước',
  className,
  ...props
}: PaginationLinkProps) {
  return (
    <PaginationLink {...props} className={cn('gap-2', className)}>
      <ChevronLeft className="size-4" />
      {children}
    </PaginationLink>
  )
}

export function PaginationNext({
  children = 'Sau',
  className,
  ...props
}: PaginationLinkProps) {
  return (
    <PaginationLink {...props} className={cn('gap-2', className)}>
      {children}
      <ChevronRight className="size-4" />
    </PaginationLink>
  )
}

export function PaginationEllipsis({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} aria-hidden="true" className={cn('inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-muted', className)}>
      <MoreHorizontal className="size-4" />
    </span>
  )
}
