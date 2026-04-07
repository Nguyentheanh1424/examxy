import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/app/app-layout'
import { NotFoundPage } from '@/app/not-found-page'
import { AuthProvider } from '@/features/auth/auth-context'
import { GuestOnlyRoute } from '@/features/auth/components/guest-only-route'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import { AccountPage } from '@/features/auth/pages/account-page'
import { ConfirmEmailPage } from '@/features/auth/pages/confirm-email-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { ResendEmailConfirmationPage } from '@/features/auth/pages/resend-email-confirmation-page'
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page'
import { RootRedirectPage } from '@/features/auth/pages/root-redirect-page'

function RootFrame() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootFrame />,
    children: [
      {
        index: true,
        element: <RootRedirectPage />,
      },
      {
        path: 'login',
        element: (
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestOnlyRoute>
            <RegisterPage />
          </GuestOnlyRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'resend-email-confirmation',
        element: <ResendEmailConfirmationPage />,
      },
      {
        path: 'confirm-email',
        element: <ConfirmEmailPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'account',
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
