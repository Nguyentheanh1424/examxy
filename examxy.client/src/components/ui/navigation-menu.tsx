/* eslint-disable react-refresh/only-export-components */

import { ChevronDown } from 'lucide-react'
import { createContext, useContext } from 'react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'

interface NavigationMenuContextValue {
  openValue: string
  setOpenValue: (value: string) => void
}

const NavigationMenuContext = createContext<NavigationMenuContextValue | null>(null)

function useNavigationMenuContext() {
  const context = useContext(NavigationMenuContext)
  if (!context) {
    throw new Error('NavigationMenu components must be used within <NavigationMenu>.')
  }

  return context
}

export function navigationMenuTriggerStyle(className?: string) {
  return cn(
    'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-brand-soft/60 hover:text-ink',
    className,
  )
}

export function NavigationMenu({
  children,
  className,
  value,
  defaultValue = '',
  onValueChange,
  ...props
}: HTMLAttributes<HTMLElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) {
  const [openValue, setOpenValue] = useControllableState({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: value,
  })

  return (
    <NavigationMenuContext.Provider value={{ openValue, setOpenValue }}>
      <nav {...props} className={cn('relative w-full', className)}>
        {children}
      </nav>
    </NavigationMenuContext.Provider>
  )
}

export function NavigationMenuList({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul {...props} className={cn('flex flex-wrap items-center gap-2', className)} />
}

export function NavigationMenuItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={cn('relative', className)} />
}

export interface NavigationMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function NavigationMenuTrigger({
  children,
  className,
  value,
  ...props
}: NavigationMenuTriggerProps) {
  const { openValue, setOpenValue } = useNavigationMenuContext()
  const isOpen = openValue === value

  return (
    <button
      {...props}
      aria-expanded={isOpen}
      className={navigationMenuTriggerStyle(className)}
      onClick={() => {
        setOpenValue(isOpen ? '' : value)
      }}
      type={props.type ?? 'button'}
    >
      {children}
      <ChevronDown className={cn('size-4 transition', isOpen && 'rotate-180')} />
    </button>
  )
}

export interface NavigationMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function NavigationMenuContent({
  className,
  value,
  ...props
}: NavigationMenuContentProps) {
  const { openValue } = useNavigationMenuContext()
  if (openValue !== value) {
    return null
  }

  return <div {...props} className={cn('absolute left-0 top-full z-40 mt-3 min-w-64 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-panel)]', className)} />
}

export function NavigationMenuLink({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} className={cn('block rounded-[calc(var(--radius-input)-0.25rem)] px-3 py-2 text-sm text-ink transition hover:bg-brand-soft/60', className)} />
}

export function NavigationMenuIndicator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-2 h-1 w-10 rounded-full bg-brand', className)} />
}

export function NavigationMenuViewport({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('relative', className)} />
}
