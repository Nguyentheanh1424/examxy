export interface AdminDashboardSummary {
  contractStatus: 'ApiReady'
  userCount: number
  activeTeacherCount: number
  activeStudentCount: number
  unresolvedAuditCount: number
  serviceHealth: 'Healthy' | 'Degraded' | 'Unavailable'
}

export interface AdminUserSummary {
  id: string
  userName: string
  email: string
  primaryRole: 'Admin' | 'Teacher' | 'Student'
  status: 'Active' | 'Locked' | 'PendingEmailConfirmation'
  createdAtUtc: string
  lastSeenAtUtc: string | null
}

export interface AdminAuditEvent {
  id: string
  occurredAtUtc: string
  actor: string
  module: string
  severity: 'Info' | 'Warning' | 'Critical'
  action: string
  summary: string
}

export interface AdminSystemHealthSummary {
  service: string
  status: 'Healthy' | 'Degraded' | 'Unavailable'
  latencyMs: number
  checkedAtUtc: string
  message: string
}

export interface AdminPagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}
