import { useState } from 'react'
import { AlertCircle, CheckCircle2, HelpCircle, Search, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils/cn'
import type { RosterImportPreviewItem } from '@/types/classroom'

interface RosterPreviewTableProps {
  items: RosterImportPreviewItem[]
  onUpdateItem: (index: number, updates: Partial<RosterImportPreviewItem>) => void
}

export function RosterPreviewTable({ items, onUpdateItem }: RosterPreviewTableProps) {
  const [filter, setFilter] = useState<'All' | 'Ready' | 'Warning' | 'Error'>('All')
  const [search, setSearch] = useState('')

  const stats = {
    all: items.length,
    ready: items.filter((i) => i.status === 'Ready').length,
    warning: items.filter((i) => i.status === 'Warning').length,
    error: items.filter((i) => i.status === 'Error').length,
  }

  const filteredItems = items.filter((item) => {
    const matchesFilter = filter === 'All' || item.status === filter
    const matchesSearch =
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.studentCode.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ready':
        return <CheckCircle2 className="size-4 text-success" />
      case 'Warning':
        return <AlertCircle className="size-4 text-warning" />
      case 'Error':
        return <XCircle className="size-4 text-danger" />
      default:
        return <HelpCircle className="size-4 text-muted" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton
            active={filter === 'All'}
            count={stats.all}
            label="Tất cả"
            onClick={() => setFilter('All')}
            tone="neutral"
          />
          <FilterButton
            active={filter === 'Ready'}
            count={stats.ready}
            label="Hợp lệ"
            onClick={() => setFilter('Ready')}
            tone="success"
          />
          <FilterButton
            active={filter === 'Warning'}
            count={stats.warning}
            label="Cần kiểm tra"
            onClick={() => setFilter('Warning')}
            tone="warning"
          />
          <FilterButton
            active={filter === 'Error'}
            count={stats.error}
            label="Lỗi"
            onClick={() => setFilter('Error')}
            tone="danger"
          />
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="h-10 w-full rounded-[var(--radius-input)] border border-line bg-surface pl-9 pr-3 text-sm focus:border-brand outline-none transition"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            type="text"
            value={search}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-line bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-alt/30">
              <TableHead className="w-16">Dòng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mã học sinh</TableHead>
              <TableHead>Dự kiến</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, idx) => (
              <TableRow
                className={cn(
                  "group transition-colors",
                  item.status === 'Error' ? "bg-danger-soft/10 hover:bg-danger-soft/20" : "hover:bg-brand-soft/10"
                )}
                key={`${item.rowNumber}-${idx}`}
              >
                <TableCell className="text-xs font-medium text-muted">
                  {item.rowNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className={cn(
                      "text-xs font-bold",
                      item.status === 'Ready' ? "text-success" : item.status === 'Warning' ? "text-warning" : "text-danger"
                    )}>
                      {item.status === 'Ready' ? 'Hợp lệ' : item.status === 'Warning' ? 'Cảnh báo' : 'Lỗi'}
                    </span>
                  </div>
                  {item.errors.concat(item.warnings).length > 0 && (
                    <p className="mt-1 text-[10px] leading-tight text-muted pr-4">
                      {item.errors.concat(item.warnings)[0]}
                    </p>
                  )}
                </TableCell>
                <TableCell className="p-0">
                  <EditableCell
                    value={item.fullName}
                    onChange={(val) => onUpdateItem(item.rowNumber - 1, { fullName: val })}
                  />
                </TableCell>
                <TableCell className="p-0">
                   <EditableCell
                    value={item.email}
                    onChange={(val) => onUpdateItem(item.rowNumber - 1, { email: val })}
                    hasError={item.errors.some(e => e.toLowerCase().includes('email'))}
                  />
                </TableCell>
                <TableCell className="p-0">
                   <EditableCell
                    value={item.studentCode}
                    onChange={(val) => onUpdateItem(item.rowNumber - 1, { studentCode: val })}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="soft" tone={item.action === 'CreateAccount' ? 'success' : 'neutral'} className="text-[10px]">
                    {item.action === 'CreateAccount' ? 'Tạo TK mới' : 
                     item.action === 'SendInvite' ? 'Gửi lời mời' : 
                     item.action === 'Skip' ? 'Bỏ qua' : 'Từ chối'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted">
                   Không tìm thấy học sinh nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  count,
  label,
  onClick,
  tone,
}: {
  active: boolean
  count: number
  label: string
  onClick: () => void
  tone: 'neutral' | 'success' | 'warning' | 'danger'
}) {
  const toneClasses = {
    neutral: active ? 'bg-ink text-white border-ink' : 'text-muted border-line hover:border-ink/40',
    success: active ? 'bg-success text-white border-success' : 'text-success border-success/30 bg-success-soft/20 hover:bg-success-soft/40',
    warning: active ? 'bg-warning text-white border-warning' : 'text-warning border-warning/30 bg-warning-soft/20 hover:bg-warning-soft/40',
    danger: active ? 'bg-danger text-white border-danger' : 'text-danger border-danger/30 bg-danger-soft/20 hover:bg-danger-soft/40',
  }

  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition",
        toneClasses[tone]
      )}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={cn("inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] leading-none", active ? "bg-white/20" : "bg-ink/10")}>
        {count}
      </span>
    </button>
  )
}

function EditableCell({
  hasError,
  onChange,
  value,
}: {
  hasError?: boolean
  onChange: (val: string) => void
  value: string
}) {
  return (
    <input
      className={cn(
        "h-full w-full bg-transparent px-3 py-4 text-sm outline-none transition focus:bg-white focus:ring-1 focus:ring-brand",
        hasError && "text-danger font-semibold bg-danger-soft/5"
      )}
      onBlur={(e) => onChange(e.target.value)}
      defaultValue={value}
      type="text"
    />
  )
}
