import { apiRequest } from '@/lib/http/api-client'
import type {
  MarkNotificationsReadResult,
  NotificationInboxList,
} from '@/types/notification'

interface NotificationListFilters {
  onlyUnread?: boolean
  limit?: number
  classId?: string | null
  scope?: string | null
  sourceType?: string | null
  notificationType?: string | null
}

function buildQuery(filters: NotificationListFilters) {
  const params = new URLSearchParams()

  if (filters.onlyUnread) {
    params.set('onlyUnread', 'true')
  }

  if (filters.limit) {
    params.set('limit', String(filters.limit))
  }

  if (filters.classId) {
    params.set('classId', filters.classId)
  }

  if (filters.scope) {
    params.set('scope', filters.scope)
  }

  if (filters.sourceType) {
    params.set('sourceType', filters.sourceType)
  }

  if (filters.notificationType) {
    params.set('notificationType', filters.notificationType)
  }

  const query = params.toString()
  return query ? `/notifications?${query}` : '/notifications'
}

export function getNotificationsRequest(filters: NotificationListFilters = {}) {
  return apiRequest<NotificationInboxList>(buildQuery(filters), {
    auth: true,
  })
}

export function markNotificationAsReadRequest(notificationId: string) {
  return apiRequest<MarkNotificationsReadResult>(`/notifications/${notificationId}/read`, {
    auth: true,
    method: 'POST',
  })
}

export function markAllNotificationsAsReadRequest(filters: NotificationListFilters = {}) {
  const query = buildQuery(filters).replace('/notifications?', '')
  const path = query ? `/notifications/read-all?${query}` : '/notifications/read-all'

  return apiRequest<MarkNotificationsReadResult>(path, {
    auth: true,
    method: 'POST',
  })
}
