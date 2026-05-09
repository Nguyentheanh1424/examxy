import { Search } from 'lucide-react'
import { createContext, useContext, useMemo, useState } from 'react'
import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'

interface CommandContextValue {
  query: string
  setQuery: (query: string) => void
}

const CommandContext = createContext<CommandContextValue | null>(null)

function useCommandContext() {
  const context = useContext(CommandContext)
  if (!context) {
    throw new Error('Command components must be used within <Command>.')
  }

  return context
}

export function Command({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const [query, setQuery] = useState('')
  const value = useMemo(() => ({ query, setQuery }), [query])

  return (
    <CommandContext.Provider value={value}>
      <div {...props} className={cn('rounded-[var(--radius-panel)] border border-line/80 bg-panel', className)}>
        {children}
      </div>
    </CommandContext.Provider>
  )
}

export function CommandDialog({ children, ...props }: { children: ReactNode } & React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogTrigger className="hidden" />
      <DialogContent className="p-0">{children}</DialogContent>
    </Dialog>
  )
}

export function CommandInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const { setQuery } = useCommandContext()

  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3">
      <Search className="size-4 text-muted" />
      <input
        {...props}
        className={cn('w-full bg-transparent text-base text-ink outline-none placeholder:text-muted/75', className)}
        onChange={(event) => {
          props.onChange?.(event)
          setQuery(event.target.value)
        }}
      />
    </div>
  )
}

export function CommandList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('max-h-80 overflow-auto p-2', className)} />
}

export function CommandEmpty({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-3 py-6 text-center text-sm text-muted', className)} />
}

export function CommandGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-1 p-1', className)} />
}

export function CommandItem({
  children,
  className,
  keywords,
  onSelect,
  value = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  keywords?: string[]
  onSelect?: () => void
  value?: string
}) {
  const { query } = useCommandContext()
  const haystack = `${value} ${(keywords ?? []).join(' ')}`.toLowerCase()
  if (query && !haystack.includes(query.toLowerCase())) {
    return null
  }

  return (
    <div
      {...props}
      className={cn('flex items-center gap-2 rounded-[calc(var(--radius-input)-0.25rem)] px-3 py-2 text-sm text-ink transition hover:bg-brand-soft/60', className)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  )
}

export function CommandShortcut({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn('ml-auto text-xs tracking-[0.16em] text-muted', className)} />
}

export function CommandSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('my-1 h-px bg-line', className)} />
}
