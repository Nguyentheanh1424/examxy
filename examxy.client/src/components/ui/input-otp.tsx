import { createContext, useContext } from 'react'
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { cn } from '@/lib/utils/cn'

interface InputOtpContextValue {
  setValueAt: (index: number, value: string) => void
  value: string[]
}

const InputOtpContext = createContext<InputOtpContextValue | null>(null)

function useInputOtpContext() {
  const context = useContext(InputOtpContext)
  if (!context) {
    throw new Error('OTP components must be used within <InputOTP>.')
  }

  return context
}

export function InputOTP({
  children,
  defaultValue = '',
  maxLength = 6,
  onChange,
  value,
}: {
  children: ReactNode
  value?: string
  defaultValue?: string
  maxLength?: number
  onChange?: (value: string) => void
}) {
  const [otpValue, setOtpValue] = useControllableState({
    defaultProp: defaultValue.padEnd(maxLength, ' ').slice(0, maxLength),
    onChange,
    prop: value,
  })

  const slots = otpValue.padEnd(maxLength, ' ').slice(0, maxLength).split('')

  return (
    <InputOtpContext.Provider
      value={{
        setValueAt(index, nextValue) {
          const nextSlots = [...slots]
          nextSlots[index] = nextValue.slice(-1)
          setOtpValue(nextSlots.join('').trimEnd())
        },
        value: slots,
      }}
    >
      <div className="inline-flex items-center gap-2">{children}</div>
    </InputOtpContext.Provider>
  )
}

export function InputOTPGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('inline-flex items-center gap-2', className)} />
}

export function InputOTPSlot({
  className,
  index,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  index: number
}) {
  const { setValueAt, value } = useInputOtpContext()

  return (
    <input
      {...props}
      className={cn('size-11 rounded-[var(--radius-input)] border border-line bg-surface text-center text-lg font-semibold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-focus/25', className)}
      inputMode="numeric"
      maxLength={1}
      onChange={(event) => {
        setValueAt(index, event.target.value)
      }}
      value={value[index] === ' ' ? '' : value[index]}
    />
  )
}

export function InputOTPSeparator({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn('text-muted', className)}>•</span>
}
