import { render, screen, waitFor } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/auth-context'
import { ProtectedRoute } from '@/features/auth/components/protected-route'
import type { AuthSession } from '@/types/auth'

function TestFrame() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

const studentSession: AuthSession = {
  accessToken: 'access-token',
  email: 'student@example.com',
  expiresAtUtc: '2030-01-01T00:00:00.000Z',
  primaryRole: 'Student',
  refreshToken: 'refresh-token',
  roles: ['Student'],
  userId: 'student-1',
  userName: 'student',
}

describe('ProtectedRoute', () => {
  it('redirects anonymous visitors to the login route', async () => {
    const router = createMemoryRouter(
      [
        {
          element: <TestFrame />,
          path: '/',
          children: [
            {
              path: 'account',
              element: (
                <ProtectedRoute>
                  <div>account page</div>
                </ProtectedRoute>
              ),
            },
            {
              path: 'login',
              element: <div>login page</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/account'],
      },
    )

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('login page')).toBeInTheDocument()
    })
  })

  it('redirects authenticated users away from dashboards outside their role', async () => {
    localStorage.setItem('examxy.auth.session', JSON.stringify(studentSession))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(studentSession)),
    )

    const router = createMemoryRouter(
      [
        {
          element: <TestFrame />,
          path: '/',
          children: [
            {
              path: 'teacher/dashboard',
              element: (
                <ProtectedRoute allowedRoles={['Teacher']}>
                  <div>teacher dashboard</div>
                </ProtectedRoute>
              ),
            },
            {
              path: 'student/dashboard',
              element: <div>student dashboard</div>,
            },
          ],
        },
      ],
      {
        initialEntries: ['/teacher/dashboard'],
      },
    )

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('student dashboard')).toBeInTheDocument()
    })
  })
})
