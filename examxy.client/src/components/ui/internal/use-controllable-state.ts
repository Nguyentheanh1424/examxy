import { useCallback, useState } from 'react'

interface UseControllableStateOptions<T> {
  prop?: T
  defaultProp: T
  onChange?: (value: T) => void
}

export function useControllableState<T>({
  defaultProp,
  onChange,
  prop,
}: UseControllableStateOptions<T>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultProp)
  const isControlled = prop !== undefined
  const value = isControlled ? prop : uncontrolledValue

  const setValue = useCallback(
    (nextValue: T | ((currentValue: T) => T)) => {
      const resolvedValue =
        typeof nextValue === 'function'
          ? (nextValue as (currentValue: T) => T)(value)
          : nextValue

      if (!isControlled) {
        setUncontrolledValue(resolvedValue)
      }

      onChange?.(resolvedValue)
    },
    [isControlled, onChange, value],
  )

  return [value, setValue] as const
}
