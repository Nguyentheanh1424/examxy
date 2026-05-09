import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/cn'

export interface PageHeaderProps {
  actions?: ReactNode
  eyebrow?: ReactNode
  title: string
  description?: ReactNode
  className?: string
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 border-b border-line/70 pb-5 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {typeof eyebrow === 'string' ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
            {eyebrow}
          </p>
        ) : eyebrow ? (
          <div>{eyebrow}</div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-muted sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
