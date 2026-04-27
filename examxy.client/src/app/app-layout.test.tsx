import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/app/app-layout'

const { useAuthMock, useUnreadNotificationCountMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useUnreadNotificationCountMock: vi.fn(),
}))

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/features/notifications/hooks/use-unread-notification-count', () => ({
  useUnreadNotificationCount: (...args: unknown[]) =>
    useUnreadNotificationCountMock(...args),
}))

function renderLayout(path = '/teacher/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppLayout />} path="/">
          <Route element={<div>Page content</div>} path="teacher/dashboard" />
          <Route element={<div>Login content</div>} path="login" />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  it('renders the protected shell with nav, user summary, and unread badge', () => {
    useAuthMock.mockReturnValue({
      logout: vi.fn(),
      session: {
        accessToken: 'token',
        email: 'teacher@example.com',
        expiresAtUtc: '2026-04-22T00:00:00.000Z',
        primaryRole: 'Teacher',
        refreshToken: 'refresh',
        roles: ['Teacher'],
        userId: 'teacher-1',
        userName: 'Teacher One',
      },
      status: 'authenticated',
    })
    useUnreadNotificationCountMock.mockReturnValue(3)

    renderLayout()

    expect(screen.getByRole('link', { name: 'Classes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Question bank' })).toBeInTheDocument()
    expect(screen.getByText('Teacher One')).toBeInTheDocument()
    expect(screen.getByText('Teacher workspace')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('keeps auth routes outside the protected shell', () => {
    useAuthMock.mockReturnValue({
      logout: vi.fn(),
      session: null,
      status: 'anonymous',
    })
    useUnreadNotificationCountMock.mockReturnValue(0)

    renderLayout('/login')

    expect(screen.getByText('Login content')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Classes' })).not.toBeInTheDocument()
  })
})
