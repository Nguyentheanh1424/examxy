import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/app/app-layout'

const { authMock } = vi.hoisted(() => ({
  authMock: {
    logout: vi.fn(),
    session: {
      accessToken: 'access-token',
      email: 'teacher@example.com',
      expiresAtUtc: '2030-01-01T00:00:00.000Z',
      primaryRole: 'Teacher',
      refreshToken: 'refresh-token',
      roles: ['Teacher'],
      userId: 'teacher-1',
      userName: 'teacher',
    },
    status: 'authenticated',
  },
}))

const { authApiMock } = vi.hoisted(() => ({
  authApiMock: {
    getAccountProfileRequest: vi.fn(),
  },
}))

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => authMock,
}))

vi.mock('@/features/auth/lib/auth-api', () => ({
  getAccountProfileRequest: authApiMock.getAccountProfileRequest,
}))

vi.mock('@/features/notifications/hooks/use-unread-notification-count', () => ({
  useUnreadNotificationCount: () => 2,
}))

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/teacher/dashboard']}>
      <Routes>
        <Route element={<AppLayout />} path="/">
          <Route element={<p>Teacher dashboard</p>} path="teacher/dashboard" />
          <Route element={<p>Login</p>} path="login" />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    authMock.logout.mockClear()
    authApiMock.getAccountProfileRequest.mockResolvedValue({
      avatarDataUrl: null,
      avatarUrl: null,
      bio: '',
      email: 'teacher@example.com',
      emailConfirmed: true,
      fullName: 'Teacher Example',
      phoneNumber: '',
      primaryRole: 'Teacher',
      roles: ['Teacher'],
      timeZoneId: 'Asia/Ho_Chi_Minh',
      userId: 'teacher-1',
      userName: 'teacher',
    })
  })

  it('keeps account actions inside the account menu', async () => {
    const user = userEvent.setup()

    renderLayout()

    expect(await screen.findByText('Teacher Example')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Thông báo' })).toHaveAttribute(
      'href',
      '/notifications',
    )
    expect(screen.queryByRole('button', { name: 'Đăng xuất' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Teacher Example/i }))

    expect(screen.getByRole('link', { name: /Cài đặt tài khoản/ })).toHaveAttribute(
      'href',
      '/account/profile',
    )
    expect(screen.getByRole('link', { name: /Bảo mật/ })).toHaveAttribute(
      'href',
      '/account/security',
    )
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))

    expect(authMock.logout).toHaveBeenCalled()
  })
})
