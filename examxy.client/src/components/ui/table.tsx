import type { HTMLAttributes, TableHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-panel)] border border-line/80 bg-panel">
      <table
        {...props}
        className={cn('w-full caption-bottom text-sm', className)}
      />
    </div>
  )
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} className={cn('[&_tr]:border-b [&_tr]:border-line', className)} />
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} className={cn('[&_tr:last-child]:border-0', className)} />
}

export function TableFooter({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot {...props} className={cn('border-t border-line bg-surface-alt/65 font-medium', className)} />
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...props}
      className={cn('border-b border-line transition hover:bg-brand-soft/30', className)}
    />
  )
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn('h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong', className)}
    />
  )
}

export function TableCell({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return <td {...props} className={cn('px-4 py-3 align-middle text-sm text-ink', className)} />
}

export function TableCaption({
  className,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption {...props} className={cn('mt-4 text-sm text-muted', className)} />
}
