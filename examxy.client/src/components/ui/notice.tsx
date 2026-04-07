import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import type { NoticeTone } from '@/types/ui'

const iconMap = {
  error: ShieldAlert,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
} satisfies Record<NoticeTone, typeof Info>

const toneClasses: Record<NoticeTone, string> = {
  error: 'border-danger/18 bg-danger-soft text-danger',
  info: 'border-brand/18 bg-brand-soft/70 text-brand-strong',
  success: 'border-success/18 bg-success-soft text-success',
  warning: 'border-warning/18 bg-warning-soft text-ink',
}

interface NoticeProps {
  tone: NoticeTone
  title?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function Notice({
  actions,
  children,
  className,
  title,
  tone,
}: NoticeProps) {
  const Icon = iconMap[tone]

  return (
    <div
      className={cn(
        'rounded-3xl border px-4 py-3 sm:px-5',
        toneClasses[tone],
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />

        <div className="min-w-0 flex-1">
          {title ? (
            <p className="text-sm font-semibold text-ink">{title}</p>
          ) : null}

          <div className="text-sm leading-6 text-muted">{children}</div>

          {actions ? (
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-ink">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
