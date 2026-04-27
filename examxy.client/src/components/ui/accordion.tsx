import { ChevronDown } from 'lucide-react'
import { createContext, useContext } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'

import { cn } from '@/lib/utils/cn'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'

interface AccordionContextValue {
  openItems: string[]
  toggleItem: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<string>('')

function useAccordionContext() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('Accordion components must be used within <Accordion>.')
  }

  return context
}

export function Accordion({
  children,
  className,
  collapsible = false,
  defaultValue,
  onValueChange,
  type = 'single',
  value,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  type?: 'single' | 'multiple'
  collapsible?: boolean
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}) {
  const normalizedDefault = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
      ? [defaultValue]
      : []
  const normalizedValue = Array.isArray(value)
    ? value
    : value
      ? [value]
      : undefined

  const [openItems, setOpenItems] = useControllableState<string[]>({
    defaultProp: normalizedDefault,
    onChange(nextValue) {
      onValueChange?.(type === 'single' ? nextValue[0] ?? '' : nextValue)
    },
    prop: normalizedValue,
  })

  return (
    <AccordionContext.Provider
      value={{
        openItems,
        toggleItem(itemValue) {
          setOpenItems((currentItems) => {
            const hasItem = currentItems.includes(itemValue)
            if (type === 'single') {
              if (hasItem) {
                return collapsible ? [] : currentItems
              }

              return [itemValue]
            }

            if (hasItem) {
              return currentItems.filter((valueItem) => valueItem !== itemValue)
            }

            return [...currentItems, itemValue]
          })
        },
      }}
    >
      <div {...props} className={cn('grid gap-3', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({
  children,
  className,
  value,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  value: string
}) {
  return (
    <AccordionItemContext.Provider value={value}>
      <div
        {...props}
        className={cn('overflow-hidden rounded-[var(--radius-panel)] border border-line/80 bg-panel', className)}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { openItems, toggleItem } = useAccordionContext()
  const itemValue = useContext(AccordionItemContext)
  const isOpen = openItems.includes(itemValue)

  return (
    <button
      {...props}
      aria-expanded={isOpen}
      className={cn('flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium text-ink transition hover:bg-brand-soft/30', className)}
      onClick={() => {
        toggleItem(itemValue)
      }}
      type={props.type ?? 'button'}
    >
      <span>{children}</span>
      <ChevronDown className={cn('size-4 text-muted transition', isOpen && 'rotate-180')} />
    </button>
  )
}

export function AccordionContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { openItems } = useAccordionContext()
  const itemValue = useContext(AccordionItemContext)
  if (!openItems.includes(itemValue)) {
    return null
  }

  return <div {...props} className={cn('px-5 pb-5 text-sm leading-6 text-muted', className)}>{children}</div>
}
