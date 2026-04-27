import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import type { HTMLAttributes } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { cn } from '@/lib/utils/cn'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function getCalendarDays(month: Date, showOutsideDays: boolean) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const start = new Date(monthStart)
  start.setDate(monthStart.getDate() - monthStart.getDay())
  const end = new Date(monthEnd)
  end.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()))

  const days: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    if (showOutsideDays || cursor.getMonth() === month.getMonth()) {
      days.push(new Date(cursor))
    } else {
      days.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function isSameDay(left: Date | undefined, right: Date) {
  if (!left) {
    return false
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  selected?: Date
  defaultMonth?: Date
  month?: Date
  onSelect?: (date: Date) => void
  onMonthChange?: (month: Date) => void
  showOutsideDays?: boolean
}

export function Calendar({
  className,
  defaultMonth = new Date(),
  month,
  onMonthChange,
  onSelect,
  selected,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useControllableState({
    defaultProp: startOfMonth(defaultMonth),
    onChange: onMonthChange,
    prop: month ? startOfMonth(month) : undefined,
  })

  const days = useMemo(
    () => getCalendarDays(currentMonth, showOutsideDays),
    [currentMonth, showOutsideDays],
  )

  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
      }),
    [],
  )
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [],
  )

  return (
    <div
      {...props}
      className={cn('rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4', className)}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          className={buttonVariants({ size: 'sm', variant: 'outline' })}
          onClick={() => {
            setCurrentMonth(addMonths(currentMonth, -1))
          }}
          type="button"
        >
          <ChevronLeft className="size-4" />
          <span className="sr-only">Previous month</span>
        </button>

        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-strong">
          {monthFormatter.format(currentMonth)}
        </p>

        <button
          className={buttonVariants({ size: 'sm', variant: 'outline' })}
          onClick={() => {
            setCurrentMonth(addMonths(currentMonth, 1))
          }}
          type="button"
        >
          <ChevronRight className="size-4" />
          <span className="sr-only">Next month</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong">
        {days.slice(0, 7).map((day) => (
          <div key={`weekday-${day.toISOString()}`}>
            {weekdayFormatter.format(day)}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isOutside = day.getMonth() !== currentMonth.getMonth()
          const isSelected = isSameDay(selected, day)

          return (
            <button
              className={cn(
                'min-h-10 rounded-[calc(var(--radius-input)-0.25rem)] text-sm transition',
                isSelected
                  ? 'bg-brand text-white shadow-sm'
                  : isOutside
                    ? 'text-muted/60 hover:bg-surface-alt'
                    : 'bg-surface text-ink hover:bg-brand-soft/60',
              )}
              key={day.toISOString()}
              onClick={() => {
                onSelect?.(day)
              }}
              type="button"
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
