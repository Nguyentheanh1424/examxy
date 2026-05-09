import type {
  AdminAuditEvent,
  AdminDashboardSummary,
  AdminPagedResult,
  AdminSystemHealthSummary,
  AdminUserSummary,
} from '@/types/admin'

import { apiRequest } from '@/lib/http/api-client'

interface AdminListQuery {
  query?: string
  page?: number
  pageSize?: number
}

function buildQueryString(query: AdminListQuery = {}) {
  const searchParams = new URLSearchParams()

  if (query.query?.trim()) {
    searchParams.set('query', query.query.trim())
  }

  if (query.page) {
    searchParams.set('page', String(query.page))
  }

  if (query.pageSize) {
    searchParams.set('pageSize', String(query.pageSize))
  }

  const value = searchParams.toString()
  return value ? `?${value}` : ''
}

export function getAdminDashboardRequest() {
  return apiRequest<AdminDashboardSummary>('/admin/dashboard', {
    auth: true,
  })
}

export function getAdminUsersRequest(query?: AdminListQuery) {
  return apiRequest<AdminPagedResult<AdminUserSummary>>(
    `/admin/users${buildQueryString(query)}`,
    {
      auth: true,
    },
  )
}

export function getAdminAuditRequest(query?: AdminListQuery) {
  return apiRequest<AdminPagedResult<AdminAuditEvent>>(
    `/admin/audit${buildQueryString(query)}`,
    {
      auth: true,
    },
  )
}

export function getAdminSystemHealthRequest() {
  return apiRequest<AdminSystemHealthSummary[]>('/admin/system-health', {
    auth: true,
  })
}
