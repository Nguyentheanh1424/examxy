import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  HTMLAttributes,
  ReactNode,
} from 'react'

import { Portal } from '@/components/ui/internal/portal'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { useDismissableLayer } from '@/components/ui/internal/use-dismissable-layer'
import { cn } from '@/lib/utils/cn'

type PopoverSide = 'top' | 'right' | 'bottom' | 'left'
type PopoverAlign = 'start' | 'center' | 'end'

interface PopoverContextValue {
  align: PopoverAlign
  anchorRef: React.MutableRefObject<HTMLElement | null>
  open: boolean
  setOpen: (value: boolean) => void
  side: PopoverSide
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover components must be used within <Popover>.')
  }

  return context
}

export interface PopoverProps {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  side?: PopoverSide
  align?: PopoverAlign
}

export function Popover({
  align = 'center',
  children,
  defaultOpen = false,
  onOpenChange,
  open,
  side = 'bottom',
}: PopoverProps) {
  const anchorRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  })

  const value = useMemo<PopoverContextValue>(
    () => ({
      align,
      anchorRef,
      open: isOpen,
      setOpen: setIsOpen,
      side,
      triggerRef,
    }),
    [align, isOpen, setIsOpen, side],
  )

  return (
    <PopoverContext.Provider value={value}>
      {children}
    </PopoverContext.Provider>
  )
}

export interface PopoverTriggerProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean
}

export function PopoverTrigger({
  asChild,
  children,
  className,
  onClick,
  ...props
}: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopoverContext()

  const Component = asChild ? 'span' : 'button'

  return (
    <Component
      {...props}
      aria-expanded={open}
      className={cn(asChild ? 'contents' : '', className)}
      onClick={(event) => {
        onClick?.(event)
        setOpen(!open)
      }}
      ref={triggerRef as any}
      type={!asChild ? (props as any).type ?? 'button' : undefined}
    >
      {children}
    </Component>
  )
}

export function PopoverAnchor({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { anchorRef } = usePopoverContext()

  return (
    <div
      {...props}
      className={className}
      ref={(node) => {
        anchorRef.current = node
      }}
    >
      {children}
    </div>
  )
}

export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  sideOffset?: number
}

export function PopoverContent({
  children,
  className,
  sideOffset = 12,
  style,
  ...props
}: PopoverContentProps) {
  const { align, anchorRef, open, setOpen, side, triggerRef } = usePopoverContext()
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState({ left: 0, top: 0 })

  useDismissableLayer({
    containerRef: contentRef,
    enabled: open,
    onDismiss: () => {
      setOpen(false)
    },
    triggerRef,
  })

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const anchor = anchorRef.current ?? triggerRef.current
    if (!anchor) {
      return undefined
    }

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect()
      const nextLeft =
        align === 'start'
          ? rect.left
          : align === 'end'
            ? rect.right
            : rect.left + rect.width / 2
      const nextTop =
        side === 'top'
          ? rect.top - sideOffset
          : side === 'bottom'
            ? rect.bottom + sideOffset
            : rect.top + rect.height / 2

      setPosition({ left: nextLeft, top: nextTop })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [align, anchorRef, open, side, sideOffset, triggerRef])

  if (!open) {
    return null
  }

  const transformClass =
    side === 'top'
      ? align === 'start'
        ? '-translate-y-full'
        : align === 'end'
          ? '-translate-x-full -translate-y-full'
          : '-translate-x-1/2 -translate-y-full'
      : side === 'left'
        ? align === 'start'
          ? '-translate-x-full'
          : align === 'end'
            ? '-translate-x-full -translate-y-full'
            : '-translate-x-full -translate-y-1/2'
        : side === 'right'
          ? align === 'start'
            ? ''
            : align === 'end'
              ? '-translate-y-full'
              : '-translate-y-1/2'
          : align === 'start'
            ? ''
            : align === 'end'
              ? '-translate-x-full'
              : '-translate-x-1/2'

  return (
    <Portal>
      <div
        {...props}
        className={cn(
          'fixed z-50 min-w-48 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-panel p-2 shadow-[var(--shadow-panel)]',
          transformClass,
          className,
        )}
        ref={contentRef}
        style={{
          ...style,
          left: position.left,
          top: position.top,
        }}
      >
        {children}
      </div>
    </Portal>
  )
}
