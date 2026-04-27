import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { createContext, useContext } from 'react'

import { cn } from '@/lib/utils/cn'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'

interface TabsContextValue {
  value: string
  setValue: (nextValue: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within <Tabs>.')
  }

  return context
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  children,
  className,
  defaultValue = '',
  onValueChange,
  value,
  ...props
}: TabsProps) {
  const [selectedValue, setSelectedValue] = useControllableState({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: value,
  })

  return (
    <TabsContext.Provider value={{ setValue: setSelectedValue, value: selectedValue }}>
      <div {...props} className={cn('space-y-4', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn('inline-flex gap-1 rounded-full bg-surface-alt p-1', className)}
      role="tablist"
    />
  )
}

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({
  children,
  className,
  value,
  ...props
}: TabsTriggerProps) {
  const { setValue, value: selectedValue } = useTabsContext()
  const isActive = selectedValue === value

  return (
    <button
      {...props}
      aria-selected={isActive}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium transition',
        isActive
          ? 'bg-white text-ink shadow-sm'
          : 'text-muted hover:text-ink',
        className,
      )}
      onClick={() => {
        setValue(value)
      }}
      role="tab"
      type="button"
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({
  className,
  value,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()

  if (selectedValue !== value) {
    return null
  }

  return <div {...props} className={className} role="tabpanel" />
}
