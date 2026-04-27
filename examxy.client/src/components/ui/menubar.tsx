import type { HTMLAttributes, ReactNode } from 'react'

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils/cn'

export function Menubar({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('inline-flex items-center gap-1 rounded-full border border-line bg-panel p-1', className)}>{children}</div>
}

export function MenubarMenu({ children }: { children: ReactNode }) {
  return <DropdownMenu>{children}</DropdownMenu>
}

export function MenubarTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <DropdownMenuTrigger {...props} className={cn('rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-brand-soft/60 hover:text-ink', props.className)} />
}

export const MenubarContent = DropdownMenuContent
export const MenubarGroup = DropdownMenuGroup
export const MenubarSeparator = DropdownMenuSeparator
export const MenubarLabel = DropdownMenuLabel
export const MenubarItem = DropdownMenuItem
export const MenubarShortcut = DropdownMenuShortcut
export const MenubarCheckboxItem = DropdownMenuCheckboxItem
export const MenubarRadioGroup = DropdownMenuRadioGroup
export const MenubarRadioItem = DropdownMenuRadioItem
export const MenubarPortal = DropdownMenuPortal
export const MenubarSub = DropdownMenuSub
export const MenubarSubTrigger = DropdownMenuSubTrigger
export const MenubarSubContent = DropdownMenuSubContent
