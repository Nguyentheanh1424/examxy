import type { HTMLAttributes, ReactNode } from 'react'

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Portal } from '@/components/ui/internal/portal'
import { cn } from '@/lib/utils/cn'

export interface SheetProps {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Sheet = Dialog
export const SheetTrigger = DialogTrigger
export const SheetClose = DialogClose

export interface SheetContentProps extends HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export function SheetContent({
  children,
  className,
  side = 'right',
  ...props
}: SheetContentProps) {
  const sideClasses: Record<NonNullable<SheetContentProps['side']>, string> = {
    bottom:
      'bottom-0 left-1/2 w-[min(100vw,48rem)] -translate-x-1/2 rounded-t-[var(--radius-panel)] border-t border-x',
    left:
      'left-0 top-0 h-full w-[min(92vw,28rem)] border-r',
    right:
      'right-0 top-0 h-full w-[min(92vw,28rem)] border-l',
    top:
      'left-1/2 top-0 w-[min(100vw,48rem)] -translate-x-1/2 rounded-b-[var(--radius-panel)] border-b border-x',
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm" />
      <div
        {...props}
        className={cn(
          'fixed z-50 overflow-auto bg-panel p-6 shadow-[var(--shadow-panel)]',
          sideClasses[side],
          className,
        )}
        role="dialog"
      >
        {children}
      </div>
    </Portal>
  )
}

export function SheetHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <DialogHeader {...props} className={cn('mb-6', className)} />
}

export function SheetFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-6 flex flex-wrap justify-end gap-3', className)} />
}

export const SheetTitle = DialogTitle
export const SheetDescription = DialogDescription
