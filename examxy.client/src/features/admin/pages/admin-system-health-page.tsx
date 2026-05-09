import { useEffect, useState } from 'react'
import { HeartPulse } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { PageHeader } from '@/components/ui/page-header'
import { AdminContractNotice } from '@/features/admin/components/admin-contract-notice'
import { getAdminSystemHealthRequest } from '@/features/admin/lib/admin-api'
import type { AdminSystemHealthSummary } from '@/types/admin'

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getHealthTone(status: AdminSystemHealthSummary['status']) {
  if (status === 'Healthy') {
    return 'success'
  }

  return status === 'Degraded' ? 'warning' : 'error'
}

export function AdminSystemHealthPage() {
  const [services, setServices] = useState<AdminSystemHealthSummary[]>([])

  useEffect(() => {
    void getAdminSystemHealthRequest().then(setServices)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link to="/admin/dashboard">
            <Button variant="secondary">Quay lại Admin</Button>
          </Link>
        }
        description="Xem lại tình trạng dịch vụ an toàn cho trình duyệt và các tín hiệu toàn vẹn danh tính."
        eyebrow="Sức khỏe hệ thống"
        title="Chẩn đoán"
      />

      <AdminContractNotice />

      <section aria-label="Dịch vụ sức khỏe hệ thống quản trị" className="grid gap-4 lg:grid-cols-3">
        {services.map((service) => (
          <CardShell
            accentTone={
              service.status === 'Healthy'
                ? 'success'
                : service.status === 'Degraded'
                  ? 'warning'
                  : 'danger'
            }
            className="p-5"
            interactive
            key={service.service}
            variant="subtle"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-lg font-semibold text-ink">
                    <HeartPulse className="size-5 text-brand-strong" />
                    {service.service}
                  </p>
                  <p className="text-sm leading-6 text-muted">{service.message}</p>
                </div>
                <Badge dot tone={getHealthTone(service.status)} variant="soft">
                  {service.status}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                  <p className="text-sm font-medium text-muted">Độ trễ</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {service.latencyMs}ms
                  </p>
                </div>
                <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                  <p className="text-sm font-medium text-muted">Đã kiểm tra</p>
                  <p className="mt-1 text-sm leading-6 text-ink">
                    {formatUtcDate(service.checkedAtUtc)}
                  </p>
                </div>
              </div>
            </div>
          </CardShell>
        ))}
      </section>
    </div>
  )
}
