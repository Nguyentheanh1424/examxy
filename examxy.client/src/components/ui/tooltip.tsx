import { createContext, useContext, useMemo, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import { Portal } from '@/components/ui/internal/portal'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { useDismissableLayer } from '@/components/ui/internal/use-dismissable-layer'
import { cn } from '@/lib/utils/cn'

interface TooltipContextValue {
  open: boolean
  position: { left: number; top: number } | null
  setPosition: (position: { left: number; top: number } | null) => void
  setOpen: (open: boolean) => void
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

function useTooltipContext() {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('Tooltip components must be used within <Tooltip>.')
  }

  return context
}

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function Tooltip({
  children,
  defaultOpen = false,
  open,
  onOpenChange,
}: {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  })

  const value = useMemo<TooltipContextValue>(
    () => ({
      open: isOpen,
      position,
      setPosition,
      setOpen: setIsOpen,
      triggerRef,
    }),
    [isOpen, position, setIsOpen],
  )

  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
}

export function TooltipTrigger({
  children,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen, setPosition, triggerRef } = useTooltipContext()

  function syncPosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) {
      return
    }

    setPosition({
      left: rect.left + rect.width / 2,
      top: rect.top - 10,
    })
  }

  return (
    <button
      {...props}
      onBlur={(event) => {
        onBlur?.(event)
        setPosition(null)
        setOpen(false)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        syncPosition()
        setOpen(true)
      }}
      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        syncPosition()
        setOpen(true)
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event)
        setPosition(null)
        setOpen(false)
      }}
      ref={triggerRef}
      type={props.type ?? 'button'}
    >
      {children}
    </button>
  )
}

export function TooltipContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open, position, setOpen, triggerRef } = useTooltipContext()
  const contentRef = useRef<HTMLDivElement | null>(null)

  useDismissableLayer({
    containerRef: contentRef,
    enabled: open,
    onDismiss: () => {
      setOpen(false)
    },
    triggerRef,
  })

  if (!open || !position) {
    return null
  }

  return (
    <Portal>
      <div
        {...props}
        className={cn(
          'fixed z-50 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white shadow-lg',
          className,
        )}
        ref={contentRef}
        style={{
          left: position.left,
          top: position.top,
          transform: 'translate(-50%, -100%)',
        }}
        role="tooltip"
      >
        {children}
      </div>
    </Portal>
  )
}
