import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/auth-context'
import { authCopy } from '@/features/auth/lib/auth-copy'
import { loginAssetSlots } from '@/features/auth/lib/login-asset-slots'
import { LoginPage } from '@/features/auth/pages/login-page'
import type { AuthSession } from '@/types/auth'

const storedSession: AuthSession = {
  accessToken: 'access-token',
  email: 'teacher@example.com',
  expiresAtUtc: '2030-01-01T00:00:00.000Z',
  primaryRole: 'Teacher',
  refreshToken: 'refresh-token',
  roles: ['Teacher'],
  userId: 'user-1',
  userName: 'teacher',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<div>Teacher dashboard</div>} path="/teacher/dashboard" />
          <Route element={<div>Trang quên mật khẩu</div>} path="/forgot-password" />
          <Route
            element={<div>Trang gửi lại email xác nhận</div>}
            path="/resend-email-confirmation"
          />
          <Route element={<div>Trang đăng ký</div>} path="/register" />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders user-facing content and opens the social popup', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByText(authCopy.login.socialDivider)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: authCopy.login.socialProviderLabel }),
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(authCopy.login.socialPopupTitle)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: authCopy.login.socialPopupConfirm }),
    )

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('falls back to the default hero artwork when the optional image fails', () => {
    renderLoginPage()

    fireEvent.error(screen.getByAltText(loginAssetSlots.hero.alt))

    expect(
      screen.getByRole('img', { name: authCopy.loginAsset.heroFallbackAlt }),
    ).toBeInTheDocument()
  })

  it('shows Vietnamese validation messages for empty fields', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(
      screen.getByText('Vui lòng nhập email hoặc tên đăng nhập.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()
  })

  it('logs in successfully and persists the session to localStorage by default', async () => {
    const user = userEvent.setup()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(storedSession)))

    renderLoginPage()

    await user.type(
      screen.getByLabelText('Email hoặc tên đăng nhập'),
      'teacher@example.com',
    )
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(screen.getByText('Teacher dashboard')).toBeInTheDocument()
    })

    expect(localStorage.getItem('examxy.auth.session')).toContain('access-token')
    expect(sessionStorage.getItem('examxy.auth.session')).toBeNull()
  })

  it('stores the session in sessionStorage when remember me is unchecked', async () => {
    const user = userEvent.setup()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(storedSession)))

    renderLoginPage()

    await user.click(screen.getByLabelText('Ghi nhớ đăng nhập'))
    await user.type(
      screen.getByLabelText('Email hoặc tên đăng nhập'),
      'teacher@example.com',
    )
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(screen.getByText('Teacher dashboard')).toBeInTheDocument()
    })

    expect(localStorage.getItem('examxy.auth.session')).toBeNull()
    expect(sessionStorage.getItem('examxy.auth.session')).toContain('access-token')
  })

  it('surfaces the email confirmation flow with a resend link', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            code: 'forbidden',
            errors: null,
            message: 'Email confirmation is required before login.',
            statusCode: 403,
            traceId: 'trace-403',
          },
          403,
        ),
      ),
    )

    renderLoginPage()

    await user.type(
      screen.getByLabelText('Email hoặc tên đăng nhập'),
      'teacher@example.com',
    )
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Vui lòng xác nhận email')).toBeInTheDocument()
    expect(
      screen.getByText(/Tài khoản của bạn chưa hoàn tất bước xác nhận email/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Gửi lại email xác nhận' }),
    ).toHaveAttribute(
      'href',
      '/resend-email-confirmation?email=teacher%40example.com',
    )
  })
})
