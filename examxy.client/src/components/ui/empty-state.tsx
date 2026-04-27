import type { ReactNode } from 'react'
import {
  AlertTriangle,
  FileX,
  SearchX,
  ShieldOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

const iconMap = {
  error: AlertTriangle,
  'no-data': FileX,
  'no-permission': ShieldOff,
  'no-results': SearchX,
} as const

export interface EmptyStateProps {
  variant?: keyof typeof iconMap
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    leftIcon?: ReactNode
  }
  className?: string
}

export function EmptyState({
  action,
  className,
  description,
  title,
  variant = 'no-data',
}: EmptyStateProps) {
  const Icon = iconMap[variant]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-[var(--radius-panel)] border border-dashed border-line bg-panel px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-20 items-center justify-center rounded-[calc(var(--radius-panel)-0.5rem)] bg-surface-alt text-muted">
        <Icon className="size-10" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
          {title}
        </h2>
        <p className="text-base leading-7 text-muted">{description}</p>
      </div>

      {action ? (
        <Button leftIcon={action.leftIcon} onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
