import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CardShell } from '@/components/ui/card-shell'

export function NotFoundPage() {
  return (
    <CardShell className="mx-auto max-w-2xl p-8 text-center sm:p-10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
          <Compass className="size-6" />
        </span>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Không tìm thấy
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-ink">
            Không tìm thấy trang
          </h1>
          <p className="text-base leading-7 text-muted">
            Quay lại điểm bắt đầu của không gian làm việc và tiếp tục với một
            Examxy route.
          </p>
        </div>

        <Link
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-transparent bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-strong"
          to="/"
        >
          Go to the client root
        </Link>
      </div>
    </CardShell>
  )
}
