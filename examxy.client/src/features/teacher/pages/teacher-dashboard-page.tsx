import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  BookOpen,
  Clock,
  FileText,
  MoreHorizontal,
  PlusCircle,
  Upload,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { getTeacherClassesRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type { TeacherClassSummary } from '@/types/classroom'
import { CreateClassDialog } from '@/features/teacher/components/create-class-dialog'
import { ClassCreationSuccessDialog } from '@/features/teacher/components/class-creation-success-dialog'
import { AddStudentDialog } from '@/features/teacher/components/add-student-dialog'

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function getTeacherDashboardMetrics(classes: TeacherClassSummary[]) {
  const activeClasses = classes.filter((item) => item.status === 'Active')

  return {
    activeClassCount: activeClasses.length,
    activeStudentCount: activeClasses.reduce(
      (total, item) => total + item.activeStudentCount,
      0,
    ),
    pendingInviteCount: activeClasses.reduce(
      (total, item) => total + item.pendingInviteCount,
      0,
    ),
  }
}

export function TeacherDashboardPage() {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [successState, setSuccessState] = useState<{
    classId: string
    joinCode: string
    method: 'JoinCode' | 'Excel'
  } | null>(null)
  const [importTarget, setImportTarget] = useState<{ id: string; code: string } | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const response = await getTeacherClassesRequest()
        if (isMounted) {
          setClasses(response)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(
            getErrorMessage(
              nextError,
              'Không thể tải danh sách lớp học của bạn.',
            ),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const metrics = getTeacherDashboardMetrics(classes)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="primary"
          >
            <PlusCircle className="size-4" />
            Tạo lớp mới
          </Button>
        }
        description="Theo dõi lớp đang hoạt động, danh sách học sinh và lời mời còn chờ."
        title="Lớp học"
      />

      {error ? (
        <Notice tone="error" title="Không thể tải lớp học">
          {error}
        </Notice>
      ) : null}

      <section
        aria-label="Chỉ số bảng điều khiển giáo viên"
        className="grid gap-4 md:grid-cols-3"
      >
        <MetricCard
          accentTone="brand"
          icon={<BookOpen className="size-5" />}
          isLoading={isLoading}
          label="Lớp đang hoạt động"
          value={metrics.activeClassCount}
        />
        <MetricCard
          accentTone="success"
          icon={<Users className="size-5" />}
          isLoading={isLoading}
          label="Học sinh đang học"
          value={metrics.activeStudentCount}
        />
        <MetricCard
          accentTone="warning"
          icon={<Clock className="size-5" />}
          isLoading={isLoading}
          label="Lời mời đang chờ"
          value={metrics.pendingInviteCount}
        />
      </section>

      {isLoading ? <ClassSkeletonGrid /> : null}

      {!isLoading && classes.length === 0 ? (
        <EmptyState
          action={{
            label: 'Tạo lớp mới',
            leftIcon: <PlusCircle className="size-4" />,
            onClick: () => setIsCreateDialogOpen(true),
          }}
          description="Tạo lớp đầu tiên để nhập danh sách học sinh, gửi lời mời và bắt đầu quản lý hoạt động học tập."
          title="Chưa có lớp nào"
          variant="no-data"
        />
      ) : null}

      {!isLoading && classes.length > 0 ? (
        <section aria-labelledby="teacher-classes" className="space-y-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                className="text-xl font-semibold tracking-[-0.03em] text-ink"
                id="teacher-classes"
              >
                Lớp của bạn
              </h2>
              <p className="text-sm leading-6 text-muted">
                {classes.length} lớp từ dữ liệu hiện tại.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((item) => (
              <ClassCard 
                item={item} 
                key={item.id} 
                onImport={(id, code) => setImportTarget({ id, code })}
              />
            ))}
          </div>
        </section>
      ) : null}

      <CreateClassDialog
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={async (classId, method) => {
          setIsCreateDialogOpen(false)

          const freshClasses = await getTeacherClassesRequest()
          setClasses(freshClasses)

          const createdClass = freshClasses.find((c) => c.id === classId)

          setSuccessState({
            classId,
            joinCode: createdClass?.code || 'ERROR',
            method,
          })
        }}
        open={isCreateDialogOpen}
      />

      <ClassCreationSuccessDialog
        classId={successState?.classId ?? null}
        joinCode={successState?.joinCode ?? null}
        method={successState?.method ?? null}
        onClose={() => setSuccessState(null)}
        onShowImport={() => {
          if (successState) {
            setImportTarget({ id: successState.classId, code: successState.joinCode })
            setSuccessState(null)
          }
        }}
        open={successState !== null}
      />

      {importTarget && (
        <AddStudentDialog
          classId={importTarget.id}
          joinCode={importTarget.code}
          onClose={() => setImportTarget(null)}
          open={importTarget !== null}
          initialView="IMPORT_INPUT"
        />
      )}
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
  value: number
}) {
  const iconToneClass = {
    brand: 'bg-brand-soft text-brand-strong',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
  }[accentTone]

  return (
    <CardShell
      accentTone={accentTone}
      className="p-4"
      interactive
      variant="subtle"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-[calc(var(--radius-panel)-0.75rem)] ${iconToneClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>

          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-14" />
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

function ClassSkeletonGrid() {
  return (
    <section
      aria-label="Đang tải lớp học"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {[0, 1, 2, 3].map((item) => (
        <CardShell className="h-full p-4" key={item}>
          <div className="space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>

            <Skeleton className="h-20 rounded-[calc(var(--radius-panel)-0.5rem)]" />
            <Skeleton className="h-10 rounded-full" />
          </div>
        </CardShell>
      ))}
    </section>
  )
}

function ClassCard({ 
  item, 
  onImport 
}: { 
  item: TeacherClassSummary
  onImport: (id: string, code: string) => void
}) {
  const isArchived = item.status === 'Archived'

  return (
    <CardShell
      accentTone={isArchived ? 'none' : 'brand'}
      className="flex h-full flex-col p-4"
      interactive
      variant={isArchived ? 'flat' : 'subtle'}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
              {item.code}
            </p>

            <h3
              className="truncate text-base font-semibold tracking-[-0.02em] text-ink"
              title={item.name}
            >
              {item.name}
            </h3>

            <p className="text-xs leading-5 text-muted">
              Tạo lúc {formatUtcDate(item.createdAtUtc)}
            </p>
          </div>

          <Badge
            dot
            tone={isArchived ? 'neutral' : 'success'}
            variant="soft"
          >
            {item.status}
          </Badge>
        </div>

        <div className="grid gap-2 rounded-[calc(var(--radius-panel)-0.5rem)] bg-surface-alt/70 p-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Môn học
            </p>

            <p className="mt-1 truncate text-sm font-medium text-ink">
              {item.subject || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Khối
              </p>

              <p className="mt-1 truncate text-sm font-medium text-ink">
                {item.grade || 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Kỳ học
              </p>

              <p className="mt-1 truncate text-sm font-medium text-ink">
                {item.term || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between rounded-[calc(var(--radius-panel)-0.5rem)] border border-line bg-surface px-3 py-2">
            <p className="text-sm font-medium text-muted">Học sinh</p>

            <p className="text-base font-semibold tabular-nums text-ink">
              {item.activeStudentCount}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-[calc(var(--radius-panel)-0.5rem)] border border-line bg-surface px-3 py-2">
            <p className="text-sm font-medium text-muted">Đang chờ</p>

            <p className="text-base font-semibold tabular-nums text-ink">
              {item.pendingInviteCount}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Link className="min-w-0 flex-1" to={`/classes/${item.id}`}>
            <Button
              fullWidth
              leftIcon={<BookOpen className="size-4" />}
              size="sm"
            >
              Mở lớp
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Thêm thao tác cho ${item.name}`}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-brand-soft/60"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <Link to={`/classes/${item.id}/assessments`}>
                <DropdownMenuItem>
                  <FileText className="size-4 text-brand-strong" />
                  Bài đánh giá
                </DropdownMenuItem>
              </Link>

              <DropdownMenuItem onClick={() => onImport(item.id, item.code)}>
                <Upload className="size-4 text-brand-strong" />
                Nhập học sinh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardShell>
  )
}