import { BellRing, Check, CheckCheck, Filter, MoreHorizontal, RefreshCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { CheckboxField } from '@/components/ui/checkbox-field'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/sonner'
import { useRealtime } from '@/features/realtime/use-realtime'
import { realtimeEventTypes } from '@/features/realtime/lib/realtime-event-types'
import { getErrorMessage } from '@/lib/http/api-error'
import type { RealtimeEventEnvelope } from '@/features/realtime/types/realtime'
import {
  getNotificationsRequest,
  markAllNotificationsAsReadRequest,
  markNotificationAsReadRequest,
} from '@/features/notifications/lib/notification-api'
import type { NotificationInboxItem } from '@/types/notification'

function formatUtcDate(value: string | null) {
  if (!value) return 'Chưa đọc'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function buildNotificationTarget(notification: NotificationInboxItem) {
  if (notification.featureArea === 'schedule' && notification.classId && notification.scheduleItemId) {
    const params = new URLSearchParams({
      scheduleItemId: notification.scheduleItemId,
    })

    return `/classes/${notification.classId}?${params.toString()}`
  }

  if (notification.featureArea === 'assessments' && notification.classId) {
    const params = new URLSearchParams()
    if (notification.assessmentId) {
      params.set('assessmentId', notification.assessmentId)
    }

    const query = params.toString()
    return query
      ? `/classes/${notification.classId}/assessments?${query}`
      : `/classes/${notification.classId}/assessments`
  }

  if (notification.classId) {
    const params = new URLSearchParams()
    if (notification.postId) {
      params.set('postId', notification.postId)
    }

    if (notification.commentId) {
      params.set('commentId', notification.commentId)
    }

    const query = params.toString()
    return query ? `${notification.linkPath}?${query}` : notification.linkPath
  }

  return notification.linkPath || '/notifications'
}

export function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { addEventListener } = useRealtime()
  const [items, setItems] = useState<NotificationInboxItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markAllDialogOpen, setMarkAllDialogOpen] = useState(false)

  const onlyUnread = searchParams.get('onlyUnread') === 'true'
  const selectedClassId = searchParams.get('classId')

  const heading = useMemo(() => {
    if (selectedClassId) {
      return 'Thông báo lớp học'
    }

    return 'Hộp thư thông báo'
  }, [selectedClassId])

  const loadNotifications = useCallback(async (showLoader: boolean) => {
    if (showLoader) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    setError(null)

    try {
      const response = await getNotificationsRequest({
        onlyUnread,
        classId: selectedClassId,
        limit: 50,
      })
      setItems(response.items)
      setUnreadCount(response.unreadCount)
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'Không thể tải thông báo.'))
      toast({
        description: getErrorMessage(nextError, 'Không thể tải thông báo.'),
        title: 'Không thể tải thông báo',
        tone: 'error',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [onlyUnread, selectedClassId])

  useEffect(() => {
    void loadNotifications(true)
  }, [loadNotifications])

  useEffect(() => {
    const removeListener = addEventListener((event: RealtimeEventEnvelope) => {
      if (
        event.eventType !== realtimeEventTypes.notification.created &&
        event.eventType !== realtimeEventTypes.notification.read
      ) {
        return
      }

      void loadNotifications(false)
    })

    return removeListener
  }, [addEventListener, loadNotifications])

  async function handleMarkOne(item: NotificationInboxItem) {
    try {
      const result = await markNotificationAsReadRequest(item.id)
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id
            ? {
                ...candidate,
                isRead: true,
                readAtUtc: new Date().toISOString(),
              }
            : candidate,
        ),
      )
      setUnreadCount(result.unreadCount)
      toast({
        description: 'Thông báo đã được đánh dấu là đã đọc.',
        title: 'Đã cập nhật thông báo',
        tone: 'success',
      })
    } catch (nextError) {
      toast({
        description: getErrorMessage(nextError, 'Không thể cập nhật trạng thái thông báo.'),
        title: 'Không thể đánh dấu thông báo',
        tone: 'error',
      })
    }
  }

  async function handleMarkAll() {
    setIsMarkingAll(true)

    try {
      const result = await markAllNotificationsAsReadRequest({
        classId: selectedClassId,
      })
      setItems((current) =>
        current.map((candidate) => ({
          ...candidate,
          isRead: true,
          readAtUtc: candidate.readAtUtc ?? new Date().toISOString(),
        })),
      )
      setUnreadCount(result.unreadCount)
      toast({
        description: 'Các thông báo đã được đánh dấu là đã đọc.',
        title: 'Đã cập nhật thông báo',
        tone: 'success',
      })
      setMarkAllDialogOpen(false)
    } catch (nextError) {
      toast({
        description: getErrorMessage(nextError, 'Không thể cập nhật trạng thái hộp thư.'),
        title: 'Không thể đánh dấu tất cả thông báo',
        tone: 'error',
      })
    } finally {
      setIsMarkingAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-line/70 pb-5">
          <div className="flex items-center gap-3 rounded-full border border-brand/20 bg-surface/85 px-5 py-3 text-sm font-medium text-muted shadow-[var(--shadow-subtle)]">
            <Spinner />
            Đang tải thông báo...
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-16 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/70 bg-surface/70 shadow-[var(--shadow-subtle)]" />
          <div className="h-16 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/70 bg-surface/70 shadow-[var(--shadow-subtle)]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <p className="rounded-full border border-brand/20 bg-surface/85 px-4 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-subtle)]">
            {unreadCount} chưa đọc
          </p>
        }
        description="Xem lại các cảnh báo cấp tài khoản, sau đó chuyển thẳng đến bảng tin lớp học hoặc bài kiểm tra mà không mất ngữ cảnh."
        eyebrow="Hộp thư tài khoản"
        title={heading}
      />

      {error ? (
        <Notice tone="error" title="Không thể tải thông báo">
          {error}
        </Notice>
      ) : null}

      <CardShell className="p-4 sm:p-5" variant="subtle">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BellRing className="size-4 text-brand-strong" />
              Thanh công cụ hộp thư
            </p>
            <p className="text-sm text-muted">
              Lọc hộp thư tài khoản hoặc thu hẹp theo một lớp học cụ thể.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              isLoading={isRefreshing}
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => { void loadNotifications(false) }}
              variant="secondary"
            >
              Làm mới
            </Button>
            <Button
              disabled={unreadCount === 0}
              isLoading={isMarkingAll}
              leftIcon={<CheckCheck className="size-4" />}
              onClick={() => {
                if (unreadCount > 0) {
                  setMarkAllDialogOpen(true)
                }
              }}
              variant="secondary"
            >
              Đánh dấu tất cả đã đọc
            </Button>
            <CheckboxField
              checked={onlyUnread}
              label="Chỉ chưa đọc"
              onChange={(event) => {
                const nextParams = new URLSearchParams(searchParams)
                if (event.target.checked) {
                  nextParams.set('onlyUnread', 'true')
                } else {
                  nextParams.delete('onlyUnread')
                }

                setSearchParams(nextParams)
              }}
            />
            {selectedClassId ? (
              <Button
                leftIcon={<Filter className="size-4" />}
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.delete('classId')
                  setSearchParams(nextParams)
                }}
                variant="secondary"
              >
                Xóa bộ lọc lớp
              </Button>
            ) : null}
          </div>
        </div>
      </CardShell>

      <AlertDialog onOpenChange={setMarkAllDialogOpen} open={markAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đánh dấu tất cả thông báo đã đọc?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ đánh dấu tất cả thông báo chưa đọc trong bộ lọc hiện tại là đã đọc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setMarkAllDialogOpen(false) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isMarkingAll}
              onClick={() => { void handleMarkAll() }}
            >
              Đánh dấu tất cả đã đọc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
        {items.length === 0 ? (
          <CardShell className="p-6 sm:p-8" variant="subtle">
            <EmptyState
              description="Các nhắc tên mới, bài kiểm tra được xuất bản và cảnh báo hoạt động lớp học sẽ xuất hiện ở đây khi chúng nhắm vào tài khoản này."
              title="Không có thông báo nào trong chế độ xem này"
            />
          </CardShell>
        ) : null}

        {items.map((item) => (
          <CardShell
            accentTone={item.isRead ? 'none' : 'brand'}
            className="p-6"
            interactive
            key={item.id}
            variant={item.isRead ? 'subtle' : 'elevated'}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                    {item.featureArea || item.sourceType}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      item.isRead
                        ? 'border-line text-muted'
                        : 'border-brand/25 bg-brand-soft/60 text-brand-strong'
                    }`}
                  >
                    {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-ink">{item.title}</h2>
                  <p className="text-sm leading-6 text-muted">{item.message}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-muted">
                  <span className="rounded-full bg-panel px-3 py-1">
                    Tạo lúc {formatUtcDate(item.createdAtUtc)}
                  </span>
                  <span className="rounded-full bg-panel px-3 py-1">
                    Đọc lúc {formatUtcDate(item.readAtUtc)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to={buildNotificationTarget(item)}>
                  <Button variant="secondary">Mở liên kết</Button>
                </Link>
                {!item.isRead ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Thao tác cho ${item.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-brand-soft/60"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => { void handleMarkOne(item) }}>
                        <Check className="size-4 text-brand-strong" />
                        Đánh dấu đã đọc
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  )
}
