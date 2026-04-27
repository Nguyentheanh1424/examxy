import { useEffect, useState } from 'react'

import { useAuth } from '@/features/auth/auth-context'
import { getNotificationsRequest } from '@/features/notifications/lib/notification-api'
import { realtimeEventTypes } from '@/features/realtime/lib/realtime-event-types'
import { useRealtime } from '@/features/realtime/use-realtime'
import type { RealtimeEventEnvelope } from '@/features/realtime/types/realtime'

export function useUnreadNotificationCount(enabled = true) {
  const { session, status } = useAuth()
  const { addEventListener } = useRealtime()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!enabled || status !== 'authenticated' || !session) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const response = await getNotificationsRequest({ limit: 1 })
        if (!cancelled) {
          setUnreadCount(response.unreadCount)
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, session, status])

  useEffect(() => {
    if (!enabled || status !== 'authenticated' || !session) {
      return undefined
    }

    return addEventListener((event: RealtimeEventEnvelope) => {
      if (
        event.eventType !== realtimeEventTypes.notification.created &&
        event.eventType !== realtimeEventTypes.notification.read
      ) {
        return
      }

      void (async () => {
        try {
          const response = await getNotificationsRequest({ limit: 1 })
          setUnreadCount(response.unreadCount)
        } catch {
          setUnreadCount(0)
        }
      })()
    })
  }, [addEventListener, enabled, session, status])

  return !enabled || status !== 'authenticated' || !session ? 0 : unreadCount
}
