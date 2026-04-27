import { Check, ChevronRight, Circle } from 'lucide-react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'

export const DropdownMenu = Popover
export const DropdownMenuTrigger = PopoverTrigger
export function DropdownMenuPortal({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function DropdownMenuContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <PopoverContent
      {...props}
      className={cn('min-w-56 p-1', className)}
      sideOffset={10}
    />
  )
}

export function DropdownMenuGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-1', className)} />
}

export function DropdownMenuLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong', className)} />
}

export function DropdownMenuItem({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'flex w-full items-center gap-2 rounded-[calc(var(--radius-input)-0.25rem)] px-3 py-2 text-left text-sm text-ink transition hover:bg-brand-soft/60',
        className,
      )}
      type={props.type ?? 'button'}
    />
  )
}

export function DropdownMenuCheckboxItem({
  checked = false,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean
}) {
  return (
    <DropdownMenuItem {...props} className={className}>
      <Check className={cn('size-4 text-brand-strong', checked ? 'opacity-100' : 'opacity-0')} />
      {children}
    </DropdownMenuItem>
  )
}

export function DropdownMenuRadioGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-1', className)} />
}

export function DropdownMenuRadioItem({
  checked = false,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  checked?: boolean
}) {
  return (
    <DropdownMenuItem {...props} className={className}>
      <Circle className={cn('size-4 text-brand-strong', checked ? 'fill-current opacity-100' : 'opacity-35')} />
      {children}
    </DropdownMenuItem>
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('my-1 h-px bg-line', className)} />
}

export function DropdownMenuShortcut({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn('ml-auto text-xs tracking-[0.16em] text-muted', className)} />
}

export function DropdownMenuSub({ children }: { children: ReactNode }) {
  return <div className="grid gap-1">{children}</div>
}

export function DropdownMenuSubTrigger({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <DropdownMenuItem {...props} className={cn('justify-between', className)}>
      <span className="inline-flex items-center gap-2">{children}</span>
      <ChevronRight className="size-4 text-muted" />
    </DropdownMenuItem>
  )
}

export function DropdownMenuSubContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('ml-3 grid gap-1 border-l border-line pl-3', className)} />
}
