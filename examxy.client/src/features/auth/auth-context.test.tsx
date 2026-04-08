import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from '@/features/auth/auth-context'
import type { AuthSession } from '@/types/auth'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

function AuthConsumer() {
  const { session, status } = useAuth()

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="token">{session?.accessToken ?? 'none'}</span>
    </div>
  )
}

const storedSession: AuthSession = {
  accessToken: 'expired-token',
  email: 'teacher@example.com',
  expiresAtUtc: '2030-01-01T00:00:00.000Z',
  primaryRole: 'Teacher',
  refreshToken: 'refresh-token',
  roles: ['Teacher'],
  userId: 'user-1',
  userName: 'teacher',
}

describe('AuthProvider bootstrap', () => {
  it('restores a stored session by refreshing tokens on startup', async () => {
    localStorage.setItem('examxy.auth.session', JSON.stringify(storedSession))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...storedSession,
          accessToken: 'fresh-token',
        }),
      ),
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('token')).toHaveTextContent('fresh-token')
  })

  it('restores a session from sessionStorage when localStorage is empty', async () => {
    sessionStorage.setItem('examxy.auth.session', JSON.stringify(storedSession))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...storedSession,
          accessToken: 'fresh-session-token',
        }),
      ),
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('token')).toHaveTextContent('fresh-session-token')
    expect(localStorage.getItem('examxy.auth.session')).toBeNull()
    expect(sessionStorage.getItem('examxy.auth.session')).toContain(
      'fresh-session-token',
    )
  })

  it('prefers localStorage when both persistence sources have data', async () => {
    localStorage.setItem('examxy.auth.session', JSON.stringify(storedSession))
    sessionStorage.setItem(
      'examxy.auth.session',
      JSON.stringify({
        ...storedSession,
        accessToken: 'session-token',
      }),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          ...storedSession,
          accessToken: 'fresh-local-token',
        }),
      ),
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('token')).toHaveTextContent('fresh-local-token')
    expect(localStorage.getItem('examxy.auth.session')).toContain(
      'fresh-local-token',
    )
    expect(sessionStorage.getItem('examxy.auth.session')).toBeNull()
  })

  it('clears the stored session when refresh fails', async () => {
    localStorage.setItem('examxy.auth.session', JSON.stringify(storedSession))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            code: 'unauthorized',
            errors: null,
            message: 'Invalid refresh token.',
            statusCode: 401,
            traceId: 'trace-401',
          },
          401,
        ),
      ),
    )

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    })

    expect(localStorage.getItem('examxy.auth.session')).toBeNull()
    expect(sessionStorage.getItem('examxy.auth.session')).toBeNull()
  })
})
