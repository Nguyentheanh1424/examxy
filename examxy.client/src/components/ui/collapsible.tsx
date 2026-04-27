import { createContext, useContext } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import { useControllableState } from '@/components/ui/internal/use-controllable-state'

interface CollapsibleContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

function useCollapsibleContext() {
  const context = useContext(CollapsibleContext)
  if (!context) {
    throw new Error('Collapsible components must be used within <Collapsible>.')
  }

  return context
}

export function Collapsible({
  children,
  defaultOpen = false,
  onOpenChange,
  open,
}: {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  })

  return (
    <CollapsibleContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useCollapsibleContext()
  return (
    <button
      {...props}
      aria-expanded={open}
      onClick={() => {
        setOpen(!open)
      }}
      type={props.type ?? 'button'}
    />
  )
}

export function CollapsibleContent(props: HTMLAttributes<HTMLDivElement>) {
  const { open } = useCollapsibleContext()
  if (!open) {
    return null
  }

  return <div {...props} />
}
