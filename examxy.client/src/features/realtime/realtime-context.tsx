import type { PropsWithChildren } from 'react'
import {
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

import { useAuth } from '@/features/auth/auth-context'
import {
  RealtimeContext,
  type RealtimeContextValue,
} from '@/features/realtime/realtime-context-store'
import {
  realtimeHubMethods,
} from '@/features/realtime/lib/realtime-event-types'
import type { RealtimeEventEnvelope } from '@/features/realtime/types/realtime'

function buildRealtimeUrl() {
  const configuredUrl = (import.meta.env.VITE_REALTIME_URL ?? '').trim()
  if (configuredUrl) {
    return configuredUrl
  }

  const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').trim()
  if (/^https?:\/\//i.test(configuredApiBaseUrl)) {
    return new URL('/hubs/realtime', configuredApiBaseUrl).toString()
  }

  return '/hubs/realtime'
}

export function RealtimeProvider({ children }: PropsWithChildren) {
  const { session, status } = useAuth()
  const connectionRef = useRef<HubConnection | null>(null)
  const listenersRef = useRef(new Set<(event: RealtimeEventEnvelope) => void>())
  const subscribedClassIdsRef = useRef(new Set<string>())
  const recentEventIdsRef = useRef<string[]>([])

  async function ensureClassSubscriptions(connection: HubConnection) {
    for (const classId of subscribedClassIdsRef.current) {
      await connection.invoke(realtimeHubMethods.subscribeClass, classId)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      void connectionRef.current?.stop()
      connectionRef.current = null
      return
    }

    const connection = new HubConnectionBuilder()
      .withUrl(buildRealtimeUrl(), {
        accessTokenFactory: () => session.accessToken,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on(realtimeHubMethods.receiveRealtimeEvent, (event: RealtimeEventEnvelope) => {
      if (!event?.eventId) {
        return
      }

      if (recentEventIdsRef.current.includes(event.eventId)) {
        return
      }

      recentEventIdsRef.current = [...recentEventIdsRef.current.slice(-49), event.eventId]
      for (const listener of listenersRef.current) {
        listener(event)
      }
    })

    connection.onreconnected(async () => {
      await ensureClassSubscriptions(connection)
    })

    connectionRef.current = connection

    void (async () => {
      await connection.start()
      await ensureClassSubscriptions(connection)
    })()

    return () => {
      void connection.stop()
      if (connectionRef.current === connection) {
        connectionRef.current = null
      }
    }
  }, [session, status])

  const value = useMemo<RealtimeContextValue>(
    () => ({
      addEventListener(listener) {
        listenersRef.current.add(listener)
        return () => {
          listenersRef.current.delete(listener)
        }
      },
      subscribeClass(classId) {
        if (!classId) return
        subscribedClassIdsRef.current.add(classId)

        const connection = connectionRef.current
        if (!connection || connection.state !== HubConnectionState.Connected) {
          return
        }

        void connection.invoke(realtimeHubMethods.subscribeClass, classId)
      },
      unsubscribeClass(classId) {
        if (!classId) return
        subscribedClassIdsRef.current.delete(classId)

        const connection = connectionRef.current
        if (!connection || connection.state !== HubConnectionState.Connected) {
          return
        }

        void connection.invoke(realtimeHubMethods.unsubscribeClass, classId)
      },
    }),
    [],
  )

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}
