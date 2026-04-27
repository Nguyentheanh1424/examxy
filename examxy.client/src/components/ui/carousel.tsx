import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  Children,
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { HTMLAttributes } from 'react'

import { Button } from '@/components/ui/button'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { cn } from '@/lib/utils/cn'

export interface CarouselApi {
  scrollNext: () => void
  scrollPrev: () => void
  selectedIndex: number
}

interface CarouselContextValue extends CarouselApi {
  count: number
  orientation: 'horizontal' | 'vertical'
  setCount: (count: number) => void
}

const CarouselContext = createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = useContext(CarouselContext)
  if (!context) {
    throw new Error('Carousel components must be used within <Carousel>.')
  }

  return context
}

export function Carousel({
  children,
  className,
  defaultValue = 0,
  onValueChange,
  orientation = 'horizontal',
  value,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  orientation?: 'horizontal' | 'vertical'
}) {
  const [count, setCount] = useState(0)
  const [selectedIndex, setSelectedIndex] = useControllableState({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: value,
  })

  const contextValue = useMemo<CarouselContextValue>(
    () => ({
      count,
      orientation,
      scrollNext() {
        setSelectedIndex((current) => Math.min(count - 1, current + 1))
      },
      scrollPrev() {
        setSelectedIndex((current) => Math.max(0, current - 1))
      },
      selectedIndex,
      setCount,
    }),
    [count, orientation, selectedIndex, setSelectedIndex],
  )

  return (
    <CarouselContext.Provider value={contextValue}>
      <div {...props} className={cn('relative', className)}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { orientation, selectedIndex, setCount } = useCarousel()
  const childCount = Children.count(children)

  useEffect(() => {
    if (childCount) {
      setCount(childCount)
    }
  }, [childCount, setCount])

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line/80 bg-panel">
      <div
        {...props}
        className={cn(
          'flex transition-transform duration-300 motion-reduce:transition-none',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          className,
        )}
        style={{
          transform:
            orientation === 'horizontal'
              ? `translateX(-${selectedIndex * 100}%)`
              : `translateY(-${selectedIndex * 100}%)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function CarouselItem({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('min-w-full p-6', className)} />
}

export function CarouselPrevious(props: React.ComponentProps<typeof Button>) {
  const { scrollPrev, selectedIndex } = useCarousel()
  return (
    <Button
      {...props}
      className={cn('absolute left-3 top-1/2 -translate-y-1/2 shadow-sm', props.className)}
      disabled={selectedIndex === 0 || props.disabled}
      onClick={scrollPrev}
      size="icon"
      variant="outline"
    >
      <ArrowLeft className="size-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

export function CarouselNext(props: React.ComponentProps<typeof Button>) {
  const { count, scrollNext, selectedIndex } = useCarousel()
  return (
    <Button
      {...props}
      className={cn('absolute right-3 top-1/2 -translate-y-1/2 shadow-sm', props.className)}
      disabled={selectedIndex >= count - 1 || props.disabled}
      onClick={scrollNext}
      size="icon"
      variant="outline"
    >
      <ArrowRight className="size-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}
