import type { AuthSession } from '@/types/auth'

import { ApiError, buildApiError } from '@/lib/http/api-error'

interface AuthManager {
  getSession: () => AuthSession | null
  refreshSession: () => Promise<AuthSession | null>
  clearSession: () => void
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean
  body?: BodyInit | object | null
}

let authManager: AuthManager | null = null

const API_BASE_URL = (() => {
  const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').trim()

  if (!configuredBaseUrl) {
    return '/api'
  }

  return configuredBaseUrl.endsWith('/')
    ? configuredBaseUrl.slice(0, -1)
    : configuredBaseUrl
})()

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function isSerializableJsonBody(body: ApiRequestOptions['body']) {
  return (
    body !== null &&
    body !== undefined &&
    !(body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(body) &&
    !(body instanceof Blob) &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    typeof body === 'object'
  )
}

function toRequestBody(
  body: ApiRequestOptions['body'],
): BodyInit | null | undefined {
  if (body === null || body === undefined) {
    return undefined
  }

  if (isSerializableJsonBody(body)) {
    return JSON.stringify(body)
  }

  return body as BodyInit
}

async function executeRequest<T>(
  url: string,
  options: ApiRequestOptions,
  hasRetriedAfterUnauthorized = false,
): Promise<T> {
  const headers = new Headers(options.headers)

  if (options.auth) {
    const session = authManager?.getSession()

    if (!session) {
      authManager?.clearSession()

      throw new ApiError({
        statusCode: 401,
        code: 'unauthorized',
        message: 'Authentication is required.',
        traceId: 'client',
        errors: null,
      })
    }

    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  if (isSerializableJsonBody(options.body) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: toRequestBody(options.body),
  })

  if (
    response.status === 401 &&
    options.auth &&
    !hasRetriedAfterUnauthorized &&
    authManager
  ) {
    const refreshedSession = await authManager.refreshSession()

    if (refreshedSession) {
      return executeRequest<T>(url, options, true)
    }

    authManager.clearSession()
  }

  if (!response.ok) {
    throw await buildApiError(response)
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  const responseText = await response.text()
  return responseText ? (JSON.parse(responseText) as T) : (undefined as T)
}

export function setAuthManager(nextAuthManager: AuthManager | null) {
  authManager = nextAuthManager
}

export function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  return executeRequest<T>(buildUrl(path), options)
}
