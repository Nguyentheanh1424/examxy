import { render, screen, waitFor } from '@testing-library/react'
import { Outlet, RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '@/features/auth/auth-context'
import { ProtectedRoute } from '@/features/auth/components/protected-route'

function TestFrame() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
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
})
