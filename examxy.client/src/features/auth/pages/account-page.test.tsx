import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AccountNotificationsPanel,
  AccountPage,
  AccountProfilePanel,
  AccountSecurityPanel,
  AccountSessionsPanel,
} from '@/features/auth/pages/account-page'

const { authApiMock, authContextMock } = vi.hoisted(() => ({
  authApiMock: {
    changePasswordRequest: vi.fn(),
    deleteAccountAvatarRequest: vi.fn(),
    getAccountNotificationPreferencesRequest: vi.fn(),
    getAccountProfileRequest: vi.fn(),
    getAccountSessionsRequest: vi.fn(),
    revokeAccountSessionRequest: vi.fn(),
    revokeOtherAccountSessionsRequest: vi.fn(),
    updateAccountAvatarRequest: vi.fn(),
    updateAccountNotificationPreferencesRequest: vi.fn(),
    updateAccountProfileRequest: vi.fn(),
  },
  authContextMock: {
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
    signOutLocal: vi.fn(),
  },
}))

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => authContextMock,
}))

vi.mock('@/features/auth/lib/auth-api', () => authApiMock)

function renderPage(initialEntry = '/account/profile') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AccountPage />} path="/account">
          <Route element={<AccountProfilePanel />} path="profile" />
          <Route element={<AccountSecurityPanel />} path="security" />
          <Route element={<AccountSessionsPanel />} path="sessions" />
          <Route element={<AccountNotificationsPanel />} path="notifications" />
        </Route>
        <Route element={<p>Login route</p>} path="/login" />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  authApiMock.getAccountProfileRequest.mockResolvedValue({
    avatarDataUrl: null,
    avatarUrl: null,
    bio: 'Giáo viên Toán',
    email: 'teacher@example.com',
    emailConfirmed: true,
    fullName: 'Teacher Example',
    phoneNumber: '0912 345 678',
    primaryRole: 'Teacher',
    roles: ['Teacher'],
    timeZoneId: 'Asia/Ho_Chi_Minh',
    userId: 'teacher-1',
    userName: 'teacher',
  })
  authApiMock.updateAccountProfileRequest.mockResolvedValue({
    avatarDataUrl: null,
    avatarUrl: null,
    bio: 'Giáo viên Toán',
    email: 'teacher@example.com',
    emailConfirmed: true,
    fullName: 'Teacher Updated',
    phoneNumber: '0912 345 678',
    primaryRole: 'Teacher',
    roles: ['Teacher'],
    timeZoneId: 'Asia/Ho_Chi_Minh',
    userId: 'teacher-1',
    userName: 'teacher',
  })
  authApiMock.changePasswordRequest.mockResolvedValue(undefined)
  authApiMock.getAccountSessionsRequest.mockResolvedValue([
    {
      browser: 'Chrome',
      createdAtUtc: '2026-04-20T08:00:00.000Z',
      device: 'Current desktop',
      deviceType: 'Laptop',
      expiresAtUtc: '2030-01-01T00:00:00.000Z',
      id: 'session-current',
      ipAddress: '203.113.xxx.45',
      isCurrent: true,
      isRevoked: false,
      lastActiveAtUtc: '2026-04-20T08:00:00.000Z',
      location: 'Unknown location',
    },
  ])
  authApiMock.getAccountNotificationPreferencesRequest.mockResolvedValue([
    {
      channel: 'Email',
      enabled: true,
      id: 'email-assessments',
      label: 'Bài đánh giá mới & kết quả',
    },
    {
      channel: 'InApp',
      enabled: true,
      id: 'in-app-mentions',
      label: 'Khi có người nhắc tên (@)',
    },
  ])
  authApiMock.updateAccountNotificationPreferencesRequest.mockResolvedValue([
    {
      channel: 'Email',
      enabled: false,
      id: 'email-assessments',
      label: 'Bài đánh giá mới & kết quả',
    },
    {
      channel: 'InApp',
      enabled: true,
      id: 'in-app-mentions',
      label: 'Khi có người nhắc tên (@)',
    },
  ])
})

describe('AccountPage', () => {
  it('renders the account shell and profile panel from the API', async () => {
    renderPage()

    expect(await screen.findByText('Cài đặt tài khoản')).toBeInTheDocument()
    expect(screen.getByText('Hồ sơ cá nhân')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Teacher Example')).toBeInTheDocument()
    expect(screen.getByDisplayValue('teacher@example.com')).toBeInTheDocument()
    expect(screen.getByText('Đã xác minh')).toBeInTheDocument()
  })

  it('renders notification preferences grouped by channel', async () => {
    const user = userEvent.setup()

    renderPage('/account/notifications')

    expect(await screen.findByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Trong ứng dụng')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Bài đánh giá mới & kết quả'))

    await waitFor(() => {
      expect(authApiMock.updateAccountNotificationPreferencesRequest).toHaveBeenCalled()
    })
  })
})
