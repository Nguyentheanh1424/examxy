import { useEffect, useState } from 'react'
import { FileSearch, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TextField } from '@/components/ui/text-field'
import { AdminContractNotice } from '@/features/admin/components/admin-contract-notice'
import { getAdminAuditRequest } from '@/features/admin/lib/admin-api'
import type { AdminAuditEvent } from '@/types/admin'

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getSeverityTone(severity: AdminAuditEvent['severity']) {
  if (severity === 'Critical') {
    return 'error'
  }

  return severity === 'Warning' ? 'warning' : 'info'
}

export function AdminAuditLogPage() {
  const [events, setEvents] = useState<AdminAuditEvent[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    void getAdminAuditRequest({ query }).then((response) => {
      setEvents(response.items)
    })
  }, [query])

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link to="/admin/dashboard">
            <Button variant="secondary">Quay lại Admin</Button>
          </Link>
        }
        description="Xem lại các cảnh báo về tính toàn vẹn của danh tính được phơi bày thông qua API Admin UI."
        eyebrow="Nhật ký kiểm tra quản trị"
        title="Kiểm tra danh tính"
      />

      <AdminContractNotice />

      <CardShell className="space-y-5 p-6 sm:p-8" variant="elevated">
        <div className="max-w-xl">
          <TextField
            label="Tìm kiếm sự kiện kiểm tra"
            leftIcon={<Search className="size-4" />}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            placeholder="Tìm kiếm theo diễn viên, mô-đun, mức độ nghiêm trọng hoặc tóm tắt"
            value={query}
          />
        </div>

        {events.length === 0 ? (
          <EmptyState
            description="Không có sự kiện kiểm tra nào khớp với bộ lọc hiện tại."
            title="Không có sự kiện kiểm tra nào phù hợp"
            variant="no-results"
          />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line/80 bg-surface shadow-[var(--shadow-subtle)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sự kiện</TableHead>
                <TableHead>Mô-đun</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Thời điểm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow className="hover:bg-panel" key={event.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex size-10 items-center justify-center rounded-full border border-brand/20 bg-brand-soft/60 text-brand-strong">
                        <FileSearch className="size-4" />
                      </span>
                      <span>
                        <span className="block font-semibold">{event.action}</span>
                        <span className="block text-sm leading-6 text-muted">
                          {event.summary}
                        </span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{event.module}</TableCell>
                  <TableCell>
                    <Badge dot tone={getSeverityTone(event.severity)} variant="soft">
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatUtcDate(event.occurredAtUtc)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardShell>
    </div>
  )
}
