import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAdminAuditRequest,
  getAdminDashboardRequest,
  getAdminSystemHealthRequest,
  getAdminUsersRequest,
} from '@/features/admin/lib/admin-api'
import { AdminAuditLogPage } from '@/features/admin/pages/admin-audit-log-page'
import { AdminDashboardPage } from '@/features/admin/pages/admin-dashboard-page'
import { AdminSystemHealthPage } from '@/features/admin/pages/admin-system-health-page'
import { AdminUsersPage } from '@/features/admin/pages/admin-users-page'

vi.mock('@/features/admin/lib/admin-api', () => ({
  getAdminAuditRequest: vi.fn(),
  getAdminDashboardRequest: vi.fn(),
  getAdminSystemHealthRequest: vi.fn(),
  getAdminUsersRequest: vi.fn(),
}))

const getAdminAuditRequestMock = vi.mocked(getAdminAuditRequest)
const getAdminDashboardRequestMock = vi.mocked(getAdminDashboardRequest)
const getAdminSystemHealthRequestMock = vi.mocked(getAdminSystemHealthRequest)
const getAdminUsersRequestMock = vi.mocked(getAdminUsersRequest)

describe('admin API pages', () => {
  beforeEach(() => {
    getAdminDashboardRequestMock.mockResolvedValue({
      activeStudentCount: 1,
      activeTeacherCount: 1,
      contractStatus: 'ApiReady',
      serviceHealth: 'Healthy',
      unresolvedAuditCount: 1,
      userCount: 3,
    })
    getAdminUsersRequestMock.mockImplementation(async ({ query } = {}) => {
      const users = [
        {
          createdAtUtc: '2026-04-20T08:00:00.000Z',
          email: 'teacher@example.com',
          id: 'user-teacher-1',
          lastSeenAtUtc: '2026-04-30T10:15:00.000Z',
          primaryRole: 'Teacher' as const,
          status: 'Active' as const,
          userName: 'teacher',
        },
        {
          createdAtUtc: '2026-04-21T08:00:00.000Z',
          email: 'student@example.com',
          id: 'user-student-1',
          lastSeenAtUtc: null,
          primaryRole: 'Student' as const,
          status: 'PendingEmailConfirmation' as const,
          userName: 'student',
        },
      ].filter((user) => !query || user.userName.includes(query))

      return {
        items: users,
        page: 1,
        pageSize: 25,
        totalCount: users.length,
      }
    })
    getAdminAuditRequestMock.mockResolvedValue({
      items: [
        {
          action: 'missing student profile',
          actor: 'system',
          id: 'audit-1',
          module: 'Identity',
          occurredAtUtc: '2026-04-30T09:20:00.000Z',
          severity: 'Warning',
          summary: 'student@example.com is missing StudentProfile.',
        },
      ],
      page: 1,
      pageSize: 25,
      totalCount: 1,
    })
    getAdminSystemHealthRequestMock.mockResolvedValue([
      {
        checkedAtUtc: '2026-04-30T11:45:00.000Z',
        latencyMs: 42,
        message: 'Authenticated Admin UI API is available.',
        service: 'Server API',
        status: 'Healthy',
      },
    ])
  })

  it('renders dashboard links and API status', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route element={<AdminDashboardPage />} path="/admin/dashboard" />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Đã kết nối API Admin UI')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Users/ })).toHaveAttribute(
      'href',
      '/admin/users',
    )
    expect(screen.getByRole('link', { name: /Audit/ })).toHaveAttribute(
      'href',
      '/admin/audit',
    )
    await waitFor(() => {
      expect(screen.getByText('Healthy')).toBeInTheDocument()
    })
  })

  it('filters users through the Admin UI API', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route element={<AdminUsersPage />} path="/admin/users" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('teacher')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Tìm kiếm người dùng'), 'student')

    expect(screen.getByText('student')).toBeInTheDocument()
    expect(screen.queryByText('teacher')).not.toBeInTheDocument()
    expect(getAdminUsersRequestMock).toHaveBeenLastCalledWith({ query: 'student' })
  })

  it('renders audit and system health previews', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/audit']}>
        <Routes>
          <Route element={<AdminAuditLogPage />} path="/admin/audit" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('missing student profile')).toBeInTheDocument()
    expect(screen.getByText('Warning')).toBeInTheDocument()

    render(
      <MemoryRouter initialEntries={['/admin/system-health']}>
        <Routes>
          <Route element={<AdminSystemHealthPage />} path="/admin/system-health" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Server API')).toBeInTheDocument()
    expect(screen.getAllByText('Healthy')[0]).toBeInTheDocument()
  })
})
