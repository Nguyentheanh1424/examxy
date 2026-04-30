import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Clock,
  FileText,
  LibraryBig,
  PlusCircle,
  ScanSearch,
  Settings,
  Upload,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { Skeleton } from '@/components/ui/skeleton'
import { getTeacherClassesRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type { TeacherClassSummary } from '@/types/classroom'

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
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

const quickActions = [
  {
    description: 'Chuẩn bị và tái sử dụng câu hỏi cho các bài kiểm tra.',
    icon: LibraryBig,
    label: 'Ngân hàng câu hỏi',
    to: '/teacher/question-bank',
  },
  {
    description: 'Quản lý mẫu đề giấy và phiên bản OMR đang dùng.',
    icon: ScanSearch,
    label: 'Đề giấy',
    to: '/teacher/paper-exams',
  },
  {
    description: 'Theo dõi thông báo lớp học và cập nhật hệ thống.',
    icon: BellRing,
    label: 'Thông báo',
    to: '/notifications',
  },
] as const

export function TeacherDashboardPage() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState<TeacherClassSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          setError(getErrorMessage(nextError, 'Unable to load your classes.'))
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
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Teacher dashboard
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                Quản lý lớp học và danh sách học sinh
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Theo dõi lớp đang hoạt động, lời mời còn chờ và mở nhanh các
                công cụ giảng dạy đã có trong hệ thống.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/teacher/classes/new">
              <Button leftIcon={<PlusCircle className="size-4" />}>
                Tạo lớp mới
              </Button>
            </Link>
            <Link to="/notifications">
              <Button leftIcon={<BellRing className="size-4" />} variant="secondary">
                Thông báo
              </Button>
            </Link>
            <Link to="/account">
              <Button leftIcon={<Settings className="size-4" />} variant="secondary">
                Tài khoản
              </Button>
            </Link>
          </div>
        </div>
      </CardShell>

      {error ? (
        <Notice tone="error" title="Unable to load classes">
          {error}
        </Notice>
      ) : null}

      <section
        aria-label="Teacher dashboard metrics"
        className="grid gap-4 md:grid-cols-3"
      >
        <MetricCard
          icon={<BookOpen className="size-5" />}
          isLoading={isLoading}
          label="Lớp đang hoạt động"
          value={metrics.activeClassCount}
        />
        <MetricCard
          icon={<Users className="size-5" />}
          isLoading={isLoading}
          label="Học sinh đang học"
          value={metrics.activeStudentCount}
        />
        <MetricCard
          icon={<Clock className="size-5" />}
          isLoading={isLoading}
          label="Lời mời đang chờ"
          value={metrics.pendingInviteCount}
        />
      </section>

      <section aria-labelledby="teacher-quick-actions" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2
            className="text-xl font-semibold tracking-[-0.03em] text-ink"
            id="teacher-quick-actions"
          >
            Truy cập nhanh
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon

            return (
              <Link
                className="group rounded-[var(--radius-panel)] border border-line bg-panel p-5 shadow-sm transition duration-200 hover:border-brand/35 hover:bg-brand-soft/35"
                key={action.to}
                to={action.to}
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[calc(var(--radius-panel)-0.75rem)] bg-surface-alt text-brand-strong">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">
                      {action.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted">
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-strong motion-reduce:transform-none" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {isLoading ? (
        <ClassSkeletonGrid />
      ) : null}

      {!isLoading && classes.length === 0 ? (
        <EmptyState
          action={{
            label: 'Tạo lớp mới',
            leftIcon: <PlusCircle className="size-4" />,
            onClick: () => navigate('/teacher/classes/new'),
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
            <Link to="/teacher/classes/new">
              <Button
                leftIcon={<PlusCircle className="size-4" />}
                variant="secondary"
              >
                Tạo lớp mới
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {classes.map((item) => (
              <ClassCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function MetricCard({
  icon,
  isLoading,
  label,
  value,
}: {
  icon: ReactNode
  isLoading: boolean
  label: string
  value: number
}) {
  return (
    <CardShell className="p-5">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[calc(var(--radius-panel)-0.75rem)] bg-surface-alt text-brand-strong">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-ink">
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
    <section aria-label="Loading classes" className="grid gap-4 xl:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <CardShell className="p-6" key={item}>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="w-full max-w-sm space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </CardShell>
      ))}
    </section>
  )
}

function ClassCard({ item }: { item: TeacherClassSummary }) {
  const isArchived = item.status === 'Archived'

  return (
    <CardShell className="flex h-full flex-col p-6">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              {item.code}
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
              {item.name}
            </h3>
            <p className="text-sm leading-6 text-muted">
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-4">
            <p className="text-sm font-medium text-muted">Học sinh đang học</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
              {item.activeStudentCount}
            </p>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-4">
            <p className="text-sm font-medium text-muted">Lời mời đang chờ</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
              {item.pendingInviteCount}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-3">
          <Link to={`/classes/${item.id}`}>
            <Button leftIcon={<BookOpen className="size-4" />} size="sm">
              Mở lớp
            </Button>
          </Link>
          <Link to={`/classes/${item.id}/assessments`}>
            <Button
              leftIcon={<FileText className="size-4" />}
              size="sm"
              variant="secondary"
            >
              Bài đánh giá
            </Button>
          </Link>
          <Link to={`/teacher/classes/${item.id}/import`}>
            <Button
              leftIcon={<Upload className="size-4" />}
              rightIcon={<ArrowRight className="size-4" />}
              size="sm"
              variant="secondary"
            >
              Nhập học sinh
            </Button>
          </Link>
        </div>
      </div>
    </CardShell>
  )
}
