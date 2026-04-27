import { BellRing, CheckCheck, Filter, Inbox, RefreshCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { CheckboxField } from '@/components/ui/checkbox-field'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
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
  if (!value) return 'Not read yet'
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
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; title: string; message: string } | null>(null)

  const onlyUnread = searchParams.get('onlyUnread') === 'true'
  const selectedClassId = searchParams.get('classId')

  const heading = useMemo(() => {
    if (selectedClassId) {
      return 'Class notifications'
    }

    return 'Notification inbox'
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
      setError(getErrorMessage(nextError, 'Unable to load notifications.'))
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
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to mark notification',
        message: getErrorMessage(nextError, 'Could not update notification state.'),
      })
    }
  }

  async function handleMarkAll() {
    setIsMarkingAll(true)
    setNotice(null)

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
      setNotice({
        tone: 'success',
        title: 'Notifications updated',
        message: 'The selected inbox items are now marked as read.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to mark all notifications',
        message: getErrorMessage(nextError, 'Could not update the inbox state.'),
      })
    } finally {
      setIsMarkingAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading notifications...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Account inbox
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                {heading}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Review account-level alerts, then jump straight into the class feed
                or assessments experience without losing context.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              isLoading={isRefreshing}
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => { void loadNotifications(false) }}
              variant="secondary"
            >
              Refresh
            </Button>
            <Button
              isLoading={isMarkingAll}
              leftIcon={<CheckCheck className="size-4" />}
              onClick={() => { void handleMarkAll() }}
            >
              Mark all read
            </Button>
          </div>
        </div>
      </CardShell>

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="Unable to load notifications">
          {error}
        </Notice>
      ) : null}

      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-panel p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BellRing className="size-4 text-brand-strong" />
              Unread now: {unreadCount}
            </p>
            <p className="text-sm text-muted">
              Filter the account inbox or narrow it to a single class context.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CheckboxField
              checked={onlyUnread}
              label="Only unread"
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
                Clear class filter
              </Button>
            ) : null}
          </div>
        </div>
      </CardShell>

      <div className="space-y-4">
        {items.length === 0 ? (
          <CardShell className="p-6 sm:p-8">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-base font-semibold text-ink">
                <Inbox className="size-5 text-brand-strong" />
                No notifications in this view
              </p>
              <p className="text-base leading-7 text-muted">
                New mentions, assessment publishes, and class activity alerts will
                appear here when they target this account.
              </p>
            </div>
          </CardShell>
        ) : null}

        {items.map((item) => (
          <CardShell className="p-6" key={item.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                    {item.featureArea || item.sourceType}
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                    {item.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-ink">{item.title}</h2>
                  <p className="text-sm leading-6 text-muted">{item.message}</p>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted">
                  <span>Created {formatUtcDate(item.createdAtUtc)}</span>
                  <span>Read {formatUtcDate(item.readAtUtc)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to={buildNotificationTarget(item)}>
                  <Button variant="secondary">Open target</Button>
                </Link>
                {!item.isRead ? (
                  <Button
                    onClick={() => { void handleMarkOne(item) }}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </div>
          </CardShell>
        ))}
      </div>
    </div>
  )
}
