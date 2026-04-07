import type { ApiErrorResponse } from '@/types/api'

export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly traceId: string
  readonly errors: Record<string, string[]>

  constructor(payload: ApiErrorResponse) {
    super(payload.message)
    this.name = 'ApiError'
    this.statusCode = payload.statusCode
    this.code = payload.code
    this.traceId = payload.traceId
    this.errors = payload.errors ?? {}
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function normalizeServerFieldKey(fieldName: string) {
  if (!fieldName) {
    return fieldName
  }

  const [firstCharacter, ...rest] = fieldName
  return `${firstCharacter.toLowerCase()}${rest.join('')}`
}

export async function buildApiError(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json().catch(() => null)) as
      | ApiErrorResponse
      | null

    if (payload) {
      return new ApiError(payload)
    }
  }

  const fallbackMessage =
    (await response.text().catch(() => '')) || 'The request could not be completed.'

  return new ApiError({
    statusCode: response.status,
    code: 'http_error',
    message: fallbackMessage,
    traceId: 'client',
    errors: null,
  })
}

export function getFieldErrors(error: unknown) {
  if (!isApiError(error)) {
    return {}
  }

  return Object.entries(error.errors).reduce<Record<string, string>>(
    (fieldErrors, [fieldName, messages]) => {
      const normalizedFieldName = normalizeServerFieldKey(fieldName)

      if (messages.length > 0) {
        fieldErrors[normalizedFieldName] = messages[0]
      }

      return fieldErrors
    },
    {},
  )
}

export function getErrorMessage(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.',
) {
  return isApiError(error) ? error.message : fallbackMessage
}

export function isEmailConfirmationRequiredError(error: unknown) {
  return (
    isApiError(error) &&
    error.statusCode === 403 &&
    error.message.toLowerCase().includes('email confirmation')
  )
}
