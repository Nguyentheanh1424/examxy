import { describe, expect, it } from 'vitest'

import {
  ApiError,
  getFieldErrors,
  isEmailConfirmationRequiredError,
} from '@/lib/http/api-error'

describe('api-error helpers', () => {
  it('normalizes server field names to client-friendly keys', () => {
    const error = new ApiError({
      code: 'validation_error',
      errors: {
        ConfirmNewPassword: ['ConfirmNewPassword must match NewPassword.'],
        UserNameOrEmail: ['The UserNameOrEmail field is required.'],
      },
      message: 'One or more validation errors occurred.',
      statusCode: 400,
      traceId: 'trace-1',
    })

    expect(getFieldErrors(error)).toEqual({
      confirmNewPassword: 'ConfirmNewPassword must match NewPassword.',
      userNameOrEmail: 'The UserNameOrEmail field is required.',
    })
  })

  it('detects the email-confirmation-required auth error path', () => {
    const error = new ApiError({
      code: 'forbidden',
      errors: null,
      message: 'Email confirmation is required before login.',
      statusCode: 403,
      traceId: 'trace-2',
    })

    expect(isEmailConfirmationRequiredError(error)).toBe(true)
  })
})
