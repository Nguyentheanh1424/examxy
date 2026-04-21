export interface RealtimeEventEnvelope<TPayload = unknown> {
  eventId: string
  eventType: string
  occurredAtUtc: string
  scope: string
  classId: string | null
  actorUserId: string | null
  payload: TPayload
}
