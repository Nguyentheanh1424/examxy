import { createContext } from 'react'

import type { RealtimeEventEnvelope } from '@/features/realtime/types/realtime'

export interface RealtimeContextValue {
  addEventListener: (
    listener: (event: RealtimeEventEnvelope) => void,
  ) => () => void
  subscribeClass: (classId: string) => void
  unsubscribeClass: (classId: string) => void
}

export const RealtimeContext = createContext<RealtimeContextValue | null>(null)
