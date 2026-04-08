import { describe, expect, it, vi } from 'vitest'

import { apiRequest, setAuthManager } from '@/lib/http/api-client'
import type { AuthSession } from '@/types/auth'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

describe('apiRequest', () => {
  it('retries a protected request after refreshing the session once', async () => {
    let currentSession: AuthSession = {
      accessToken: 'stale-token',
      email: 'teacher@example.com',
      expiresAtUtc: '2030-01-01T00:00:00.000Z',
      primaryRole: 'Teacher',
      refreshToken: 'refresh-token',
      roles: ['Teacher'],
      userId: 'user-1',
      userName: 'teacher',
    }

    const clearSession = vi.fn()
    const refreshSession = vi.fn().mockImplementation(async () => {
      currentSession = {
        ...currentSession,
        accessToken: 'fresh-token',
      }

      return currentSession
    })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            code: 'unauthorized',
            errors: null,
            message: 'Invalid access token.',
            statusCode: 401,
            traceId: 'trace-401',
          },
          401,
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ value: 'ok' }))

    vi.stubGlobal('fetch', fetchMock)
    setAuthManager({
      clearSession,
      getSession: () => currentSession,
      refreshSession,
    })

    const result = await apiRequest<{ value: string }>('/health', {
      auth: true,
    })

    expect(refreshSession).toHaveBeenCalledOnce()
    expect(clearSession).not.toHaveBeenCalled()
    expect(result.value).toBe('ok')

    const retriedHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers)
    expect(retriedHeaders.get('Authorization')).toBe('Bearer fresh-token')

    setAuthManager(null)
  })
})
