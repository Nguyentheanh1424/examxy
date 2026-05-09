import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  Calendar,
} from '@/components/ui/calendar'
import { CardShell } from '@/components/ui/card-shell'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  ChartContainer,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Toaster,
  toast,
} from '@/components/ui/sonner'

afterEach(() => {
  vi.useRealTimers()
})

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })
}

function SidebarStateProbe() {
  const { state } = useSidebar()
  return <span>{state}</span>
}

describe('shared ui library', () => {
  it('renders optional card shell depth variants without changing the default surface', () => {
    render(
      <>
        <CardShell data-testid="default-card">Default</CardShell>
        <CardShell
          accentTone="brand"
          data-testid="interactive-card"
          interactive
          padding="md"
          selected
          variant="elevated"
        >
          Elevated
        </CardShell>
      </>,
    )

    expect(screen.getByTestId('default-card').className).toContain(
      'shadow-[var(--shadow-panel)]',
    )
    expect(screen.getByTestId('interactive-card').className).toContain(
      'border-l-brand',
    )
    expect(screen.getByTestId('interactive-card').className).toContain(
      'ring-brand/35',
    )
  })

  it('renders structural skeleton variants as decorative loading shapes', () => {
    render(<Skeleton data-testid="avatar-skeleton" height={40} variant="avatar" width={40} />)

    expect(screen.getByTestId('avatar-skeleton')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('avatar-skeleton')).toHaveClass('rounded-full')
  })

  it('opens dialog content from the trigger', async () => {
    const user = userEvent.setup()

    render(
      <Dialog>
        <DialogTrigger>Open dialog</DialogTrigger>
        <DialogContent>
          <p>Dialog body</p>
        </DialogContent>
      </Dialog>,
    )

    await user.click(screen.getByRole('button', { name: 'Open dialog' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Dialog body')).toBeInTheDocument()
  })

  it('selects an item and reflects the value in the trigger', async () => {
    const user = userEvent.setup()

    render(
      <Select defaultValue="">
        <SelectTrigger>
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="teacher">Teacher</SelectItem>
          <SelectItem value="student">Student</SelectItem>
        </SelectContent>
      </Select>,
    )

    await user.click(screen.getByRole('button', { name: /select role/i }))
    await user.click(screen.getByRole('button', { name: 'Teacher' }))

    expect(screen.getByRole('button', { name: /teacher/i })).toBeInTheDocument()
  })

  it('toggles sidebar state through the trigger', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider>
        <SidebarTrigger />
        <SidebarStateProbe />
      </SidebarProvider>,
    )

    expect(screen.getByText('expanded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(screen.getByText('collapsed')).toBeInTheDocument()
  })

  it('changes month and selects a day in calendar', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <Calendar
        defaultMonth={new Date('2026-04-01T00:00:00.000Z')}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText(/April 2026/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText(/May 2026/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '15' }))
    expect(onSelect).toHaveBeenCalled()
  })

  it('advances carousel items with navigation buttons', async () => {
    const user = userEvent.setup()

    render(
      <Carousel>
        <CarouselContent data-testid="carousel-content">
          <CarouselItem>Slide one</CarouselItem>
          <CarouselItem>Slide two</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    )

    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Next slide' }))

    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled()
    expect(screen.getByTestId('carousel-content')).toHaveStyle({
      transform: 'translateX(-100%)',
    })
  })

  it('renders chart legend and svg output', () => {
    const config: ChartConfig = {
      attempts: { color: '#2563eb', label: 'Attempts' },
    }

    render(
      <>
        <ChartContainer
          config={config}
          data={[
            { attempts: 4, label: 'Week 1' },
            { attempts: 6, label: 'Week 2' },
          ]}
        />
        <ChartLegendContent config={config} />
      </>,
    )

    expect(screen.getByRole('img', { name: 'Chart' })).toBeInTheDocument()
    expect(screen.getByText('Attempts')).toBeInTheDocument()
  })

  it('shows toast messages in the toaster', async () => {
    render(<Toaster />)

    toast({
      description: 'Background sync completed.',
      title: 'Sync finished',
      tone: 'success',
    })

    await waitFor(() => {
      expect(screen.getByText('Sync finished')).toBeInTheDocument()
      expect(screen.getByText('Background sync completed.')).toBeInTheDocument()
    })
  })
})
