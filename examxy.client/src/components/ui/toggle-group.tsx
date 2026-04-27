import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'
import { createContext, useContext } from 'react'

import { toggleVariants } from '@/components/ui/toggle'
import { cn } from '@/lib/utils/cn'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'

type ToggleGroupType = 'single' | 'multiple'

interface ToggleGroupContextValue {
  onItemToggle: (value: string) => void
  type: ToggleGroupType
  value: string[]
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null)

function useToggleGroupContext() {
  const context = useContext(ToggleGroupContext)
  if (!context) {
    throw new Error('ToggleGroupItem must be used within ToggleGroup.')
  }

  return context
}

export interface ToggleGroupProps extends HTMLAttributes<HTMLDivElement> {
  type?: ToggleGroupType
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

export function ToggleGroup({
  children,
  className,
  defaultValue,
  onValueChange,
  type = 'single',
  value,
  ...props
}: ToggleGroupProps) {
  const normalizedDefaultValue = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
      ? [defaultValue]
      : []
  const normalizedValue = Array.isArray(value)
    ? value
    : value
      ? [value]
      : undefined

  const [selectedValues, setSelectedValues] = useControllableState<string[]>({
    defaultProp: normalizedDefaultValue,
    onChange: (nextValues) => {
      onValueChange?.(type === 'single' ? nextValues[0] ?? '' : nextValues)
    },
    prop: normalizedValue,
  })

  return (
    <ToggleGroupContext.Provider
      value={{
        onItemToggle(nextValue) {
          setSelectedValues((currentValues) => {
            if (type === 'single') {
              return currentValues[0] === nextValue ? [] : [nextValue]
            }

            return currentValues.includes(nextValue)
              ? currentValues.filter((valueItem) => valueItem !== nextValue)
              : [...currentValues, nextValue]
          })
        },
        type,
        value: selectedValues,
      }}
    >
      <div {...props} className={cn('inline-flex flex-wrap gap-2', className)}>
        {children}
      </div>
    </ToggleGroupContext.Provider>
  )
}

export interface ToggleGroupItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function ToggleGroupItem({
  className,
  value,
  ...props
}: ToggleGroupItemProps) {
  const context = useToggleGroupContext()
  const pressed = context.value.includes(value)

  return (
    <button
      {...props}
      aria-pressed={pressed}
      className={toggleVariants({ className, pressed })}
      data-state={pressed ? 'on' : 'off'}
      onClick={() => {
        context.onItemToggle(value)
      }}
      type="button"
    />
  )
}
