import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { createContext, useContext, useMemo, useState } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'

interface SelectContextValue {
  labelMap: Map<string, ReactNode>
  open: boolean
  setLabel: (value: string, label: ReactNode) => void
  setOpen: (open: boolean) => void
  setValue: (value: string) => void
  value: string
}

const SelectContext = createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within <Select>.')
  }

  return context
}

export function Select({
  children,
  defaultOpen = false,
  defaultValue = '',
  onOpenChange,
  onValueChange,
  open,
  value,
}: {
  children: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [selectedValue, setSelectedValue] = useControllableState({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: value,
  })
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  })
  const [labelMap] = useState(() => new Map<string, ReactNode>())

  const contextValue = useMemo<SelectContextValue>(
    () => ({
      labelMap,
      open: isOpen,
      setLabel(valueKey, label) {
        labelMap.set(valueKey, label)
      },
      setOpen: setIsOpen,
      setValue(nextValue) {
        setSelectedValue(nextValue)
        setIsOpen(false)
      },
      value: selectedValue,
    }),
    [isOpen, labelMap, selectedValue, setIsOpen, setSelectedValue],
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        {children}
      </Popover>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open } = useSelectContext()

  return (
    <PopoverTrigger
      {...props}
      className={cn(
        'flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-left text-base text-ink transition hover:border-brand/25 focus:ring-4 focus:ring-focus/25',
        className,
      )}
    >
      <span className="truncate">{children}</span>
      <ChevronDown className={cn('size-4 text-muted transition', open && 'rotate-180')} />
    </PopoverTrigger>
  )
}

export function SelectValue({
  placeholder = 'Select an option',
}: {
  placeholder?: ReactNode
}) {
  const { labelMap, value } = useSelectContext()
  return <>{value ? labelMap.get(value) ?? value : placeholder}</>
}

export function SelectContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <PopoverContent {...props} className={cn('min-w-56 p-1', className)} sideOffset={10} />
}

export function SelectGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-1', className)} />
}

export function SelectLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong', className)} />
}

export function SelectItem({
  children,
  className,
  value,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}) {
  const { setLabel, setValue, value: selectedValue } = useSelectContext()
  setLabel(value, children)

  return (
    <button
      {...props}
      className={cn('flex w-full items-center gap-2 rounded-[calc(var(--radius-input)-0.25rem)] px-3 py-2 text-left text-sm text-ink transition hover:bg-brand-soft/60', className)}
      onClick={() => {
        setValue(value)
      }}
      type={props.type ?? 'button'}
    >
      <Check className={cn('size-4 text-brand-strong', selectedValue === value ? 'opacity-100' : 'opacity-0')} />
      {children}
    </button>
  )
}

export function SelectSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('my-1 h-px bg-line', className)} />
}

export function SelectScrollUpButton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex items-center justify-center py-1 text-muted', className)}><ChevronUp className="size-4" /></div>
}

export function SelectScrollDownButton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('flex items-center justify-center py-1 text-muted', className)}><ChevronDown className="size-4" /></div>
}
