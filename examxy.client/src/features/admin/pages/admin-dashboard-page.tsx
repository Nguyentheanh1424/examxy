import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Activity, FileSearch, HeartPulse, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminContractNotice } from '@/features/admin/components/admin-contract-notice'
import { getAdminDashboardRequest } from '@/features/admin/lib/admin-api'
import type { AdminDashboardSummary } from '@/types/admin'

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)

  useEffect(() => {
    void getAdminDashboardRequest().then(setSummary)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link to="/admin/users">
              <Button leftIcon={<UsersRound className="size-4" />}>Người dùng</Button>
            </Link>
            <Link to="/admin/audit">
              <Button leftIcon={<FileSearch className="size-4" />} variant="secondary">
                Audit
              </Button>
            </Link>
            <Link to="/admin/system-health">
              <Button leftIcon={<HeartPulse className="size-4" />} variant="secondary">
                Health
              </Button>
            </Link>
          </>
        }
        description="Xem lại các cảnh báo về tính toàn vẹn của danh tính được phơi bày thông qua API Admin UI."
        eyebrow="Bảng điều khiển quản trị"
        title="Không gian làm việc quản trị"
      />

      <AdminContractNotice />

      <section aria-label="Chỉ số quản trị" className="grid gap-4 md:grid-cols-4">
        <MetricCard
          accentTone="brand"
          icon={<UsersRound className="size-5" />}
          isLoading={!summary}
          label="Người dùng"
          value={summary?.userCount}
        />
        <MetricCard
          accentTone="success"
          icon={<UsersRound className="size-5" />}
          isLoading={!summary}
          label="Giáo viên"
          value={summary?.activeTeacherCount}
        />
        <MetricCard
          accentTone="warning"
          icon={<Activity className="size-5" />}
          isLoading={!summary}
          label="Cảnh báo kiểm tra"
          value={summary?.unresolvedAuditCount}
        />
        <MetricCard
          accentTone="brand"
          icon={<HeartPulse className="size-5" />}
          isLoading={!summary}
          label="Sức khỏe"
          value={summary?.serviceHealth}
        />
      </section>
    </div>
  )
}

function MetricCard({
  accentTone,
  icon,
  isLoading,
  label,
  value,
}: {
  accentTone: 'brand' | 'success' | 'warning'
  icon: ReactNode
  isLoading: boolean
  label: string
  value: number | string | undefined
}) {
  return (
    <CardShell accentTone={accentTone} className="p-5" interactive variant="subtle">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[calc(var(--radius-panel)-0.75rem)] border border-brand/20 bg-brand-soft/50 text-brand-strong shadow-[var(--shadow-subtle)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-ink">
              {value}
            </p>
          )}
        </div>
      </div>
    </CardShell>
  )
}
