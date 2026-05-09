import { useEffect, useState } from 'react'
import { Search, UsersRound } from 'lucide-react'
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
import { getAdminUsersRequest } from '@/features/admin/lib/admin-api'
import type { AdminUserSummary } from '@/types/admin'

function formatUtcDate(value: string | null) {
  if (!value) {
    return 'Chưa trực tuyến'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    void getAdminUsersRequest({ query }).then((response) => {
      setUsers(response.items)
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
        description="Kiểm tra tài khoản quản trị, giáo viên và sinh viên từ API Admin UI."
        eyebrow="Người dùng quản trị"
        title="Danh bạ người dùng"
      />

      <AdminContractNotice />

      <CardShell className="space-y-5 p-6 sm:p-8" variant="elevated">
        <div className="max-w-xl">
          <TextField
            label="Tìm kiếm người dùng"
            leftIcon={<Search className="size-4" />}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            placeholder="Tìm kiếm theo tên, email, vai trò hoặc trạng thái"
            value={query}
          />
        </div>

        {users.length === 0 ? (
          <EmptyState
            description="Không có người dùng nào khớp với bộ lọc hiện tại."
            title="Không có người dùng nào phù hợp"
            variant="no-results"
          />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line/80 bg-surface shadow-[var(--shadow-subtle)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Lần cuối trực tuyến</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow className="hover:bg-panel" key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full border border-brand/20 bg-brand-soft/60 text-brand-strong">
                        <UsersRound className="size-4" />
                      </span>
                      <span>
                        <span className="block font-semibold">{user.userName}</span>
                        <span className="block text-sm text-muted">{user.email}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.primaryRole}</TableCell>
                  <TableCell>
                    <Badge dot tone={user.status === 'Active' ? 'success' : 'warning'} variant="soft">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatUtcDate(user.lastSeenAtUtc)}</TableCell>
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
