/* eslint-disable react-refresh/only-export-components */

import { PanelLeft } from 'lucide-react'
import { createContext, useContext, useMemo } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { useIsMobile } from '@/components/ui/use-mobile'
import { cn } from '@/lib/utils/cn'

interface SidebarContextValue {
  isMobile: boolean
  open: boolean
  openMobile: boolean
  setOpen: (open: boolean) => void
  setOpenMobile: (open: boolean) => void
  state: 'expanded' | 'collapsed'
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within <SidebarProvider>.')
  }

  return context
}

export function SidebarProvider({
  children,
  className,
  defaultOpen = true,
  onOpenChange,
  open,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openDesktop, setOpenDesktop] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  })
  const [openMobile, setOpenMobile] = useControllableState({
    defaultProp: false,
  })

  const contextValue = useMemo<SidebarContextValue>(
    () => ({
      isMobile,
      open: openDesktop,
      openMobile,
      setOpen: setOpenDesktop,
      setOpenMobile,
      state: openDesktop ? 'expanded' : 'collapsed',
      toggleSidebar() {
        if (isMobile) {
          setOpenMobile(!openMobile)
          return
        }

        setOpenDesktop(!openDesktop)
      },
    }),
    [isMobile, openDesktop, openMobile, setOpenDesktop, setOpenMobile],
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        {...props}
        className={cn('flex min-h-screen w-full', className)}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  children,
  className,
  side = 'left',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}) {
  const { isMobile, open, openMobile } = useSidebar()
  const isVisible = isMobile ? openMobile : open

  return (
    <aside
      {...props}
      className={cn(
        'z-40 flex h-full min-h-screen flex-col border-line/80 bg-panel shadow-[var(--shadow-panel)] transition-[width,transform] duration-200',
        side === 'left' ? 'border-r' : 'border-l',
        isMobile
          ? cn(
              'fixed inset-y-0 w-[min(85vw,20rem)]',
              side === 'left' ? 'left-0' : 'right-0',
              isVisible ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
            )
          : open
            ? 'w-72'
            : 'w-20',
        className,
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarTrigger(props: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      {...props}
      onClick={() => {
        toggleSidebar()
      }}
      size="icon"
      variant="ghost"
    >
      <PanelLeft className="size-4" />
      <span className="sr-only">Bật/tắt thanh bên</span>
    </Button>
  )
}

export function SidebarRail({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      {...props}
      aria-label="Bật/tắt thanh bên"
      className={cn('absolute inset-y-0 -right-2 hidden w-2 bg-transparent md:block', className)}
      onClick={toggleSidebar}
      type="button"
    />
  )
}

export function SidebarInset({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main {...props} className={cn('flex min-h-screen flex-1 flex-col', className)} />
}

export function SidebarInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn('h-10', props.className)} />
}

export function SidebarHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex flex-col gap-3 border-b border-line/80 p-4', className)} />
}

export function SidebarFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-auto border-t border-line/80 p-4', className)} />
}

export function SidebarSeparator(props: React.ComponentProps<typeof Separator>) {
  return <Separator {...props} className={cn('bg-line/80', props.className)} />
}

export function SidebarContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex flex-1 flex-col gap-4 overflow-auto p-4', className)} />
}

export function SidebarGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-2', className)} />
}

export function SidebarGroupLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong', className)} />
}

export function SidebarGroupAction(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} className={cn('ml-auto', props.className)} size="sm" variant="ghost" />
}

export function SidebarGroupContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-1', className)} />
}

export function SidebarMenu({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul {...props} className={cn('grid gap-1', className)} />
}

export function SidebarMenuItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={cn('list-none', className)} />
}

export function SidebarMenuButton({
  className,
  isActive = false,
  ...props
}: React.ComponentProps<typeof Button> & {
  isActive?: boolean
  tooltip?: string | ReactNode
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
}) {
  return (
    <Button
      {...props}
      className={cn(
        'w-full justify-start rounded-[calc(var(--radius-input)-0.25rem)]',
        isActive && 'bg-brand-soft text-brand-strong',
        className,
      )}
      variant={props.variant === 'outline' ? 'outline' : 'ghost'}
    />
  )
}

export function SidebarMenuAction(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} size="sm" variant="ghost" />
}

export function SidebarMenuBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Badge className={className} size="sm" variant="soft">
      {children}
    </Badge>
  )
}

export function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  showIcon?: boolean
}) {
  return (
    <div {...props} className={cn('flex items-center gap-3 px-2 py-2', className)}>
      {showIcon ? <Skeleton className="size-4 rounded-full" /> : null}
      <Skeleton className="h-4 flex-1" />
    </div>
  )
}

export function SidebarMenuSub({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return <ul {...props} className={cn('ml-3 grid gap-1 border-l border-line pl-3', className)} />
}

export function SidebarMenuSubItem({ className, ...props }: HTMLAttributes<HTMLLIElement>) {
  return <li {...props} className={className} />
}

export function SidebarMenuSubButton({
  className,
  isActive = false,
  size = 'md',
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  isActive?: boolean
  size?: 'sm' | 'md'
}) {
  return (
    <a
      {...props}
      className={cn(
        'block rounded-[calc(var(--radius-input)-0.25rem)] px-3 py-2 text-sm text-muted transition hover:bg-brand-soft/60 hover:text-ink',
        isActive && 'bg-brand-soft text-brand-strong',
        size === 'sm' && 'text-xs',
        className,
      )}
    />
  )
}
