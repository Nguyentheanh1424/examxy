import type { HTMLAttributes, ReactNode } from 'react'

import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Portal } from '@/components/ui/internal/portal'
import { cn } from '@/lib/utils/cn'

export interface DrawerProps {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Drawer = Sheet
export const DrawerTrigger = SheetTrigger
export const DrawerClose = SheetClose
export const DrawerHeader = SheetHeader
export const DrawerFooter = SheetFooter
export const DrawerTitle = SheetTitle
export const DrawerDescription = SheetDescription
export const DrawerPortal = Portal

export function DrawerOverlay({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm', className)} />
}

export function DrawerContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <Portal>
      <DrawerOverlay />
      <div
        {...props}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-[var(--radius-panel)] border border-line/80 bg-panel p-6 shadow-[var(--shadow-panel)]',
          className,
        )}
        role="dialog"
      >
        {children}
      </div>
    </Portal>
  )
}
