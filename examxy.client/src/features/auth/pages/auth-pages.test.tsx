import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/auth-context'
import { authCopy } from '@/features/auth/lib/auth-copy'
import { ConfirmEmailPage } from '@/features/auth/pages/confirm-email-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page'

function renderWithRouter(initialEntry: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route element={element} path="*" />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('auth pages', () => {
  it('shows privacy-safe success copy after forgot-password submission', async () => {
    const user = userEvent.setup()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    renderWithRouter('/forgot-password', <ForgotPasswordPage />)

    await user.type(screen.getByLabelText('Email'), 'teacher@example.com')
    await user.click(
      screen.getByRole('button', { name: authCopy.forgotPassword.submitButton }),
    )

    expect(
      await screen.findByText(
        authCopy.forgotPassword.successMessage,
      ),
    ).toBeInTheDocument()
  })

  it('shows an explicit invalid-link state when confirm-email params are missing', () => {
    renderWithRouter('/confirm-email', <ConfirmEmailPage />)

    expect(
      screen.getByText(authCopy.confirmEmail.invalidLinkMessage),
    ).toBeInTheDocument()
  })

  it('confirms email successfully when the token link is complete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    renderWithRouter(
      '/confirm-email?userId=user-1&token=encoded-token',
      <ConfirmEmailPage />,
    )

    await waitFor(() => {
      expect(screen.getByText(authCopy.confirmEmail.successMessage)).toBeInTheDocument()
    })
  })

  it('shows an invalid-link state when reset-password params are missing', () => {
    renderWithRouter('/reset-password', <ResetPasswordPage />)

    expect(
      screen.getByText(authCopy.resetPassword.invalidLinkMessage),
    ).toBeInTheDocument()
  })

  it('submits a valid reset-password form and redirects to login', async () => {
    const user = userEvent.setup()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    renderWithRouter(
      '/reset-password?email=teacher@example.com&token=encoded-token',
      <ResetPasswordPage />,
    )

    await user.type(screen.getByLabelText('Mật khẩu mới'), 'NewPassword123')
    await user.type(
      screen.getByLabelText('Xác nhận mật khẩu mới'),
      'NewPassword123',
    )
    await user.click(
      screen.getByRole('button', { name: authCopy.resetPassword.submitButton }),
    )

    await waitFor(() => {
      expect(sessionStorage.getItem('examxy.flash-notice')).toContain(
        authCopy.resetPassword.successFlashMessage,
      )
    })
  })
})
