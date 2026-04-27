import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'

export interface AlertDialogProps {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const AlertDialog = Dialog
export const AlertDialogTrigger = DialogTrigger
export const AlertDialogPortal = DialogPortal
export const AlertDialogOverlay = DialogOverlay

export function AlertDialogContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <div
        {...props}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-panel)] border border-white/80 bg-panel p-6 shadow-[var(--shadow-panel)]',
          className,
        )}
        role="alertdialog"
      >
        {children}
      </div>
    </AlertDialogPortal>
  )
}

export function AlertDialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-2 text-left', className)} />
}

export function AlertDialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-6 flex flex-wrap justify-end gap-3', className)} />
}

export const AlertDialogTitle = DialogTitle
export const AlertDialogDescription = DialogDescription

export function AlertDialogAction({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button {...props} className={className} />
}

export function AlertDialogCancel({
  className,
  variant = 'secondary',
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button {...props} className={className} variant={variant} />
}
