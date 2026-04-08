import { describe, expect, it } from 'vitest'

import {
  getDefaultRouteForRole,
  hasAllowedRole,
} from '@/features/auth/lib/auth-role-routing'
import type { AuthSession } from '@/types/auth'

const teacherSession: AuthSession = {
  accessToken: 'token',
  email: 'teacher@example.com',
  expiresAtUtc: '2030-01-01T00:00:00.000Z',
  primaryRole: 'Teacher',
  refreshToken: 'refresh',
  roles: ['Teacher'],
  userId: 'teacher-1',
  userName: 'teacher',
}

describe('auth role routing', () => {
  it('maps each primary role to its default dashboard', () => {
    expect(getDefaultRouteForRole('Teacher')).toBe('/teacher/dashboard')
    expect(getDefaultRouteForRole('Student')).toBe('/student/dashboard')
    expect(getDefaultRouteForRole('Admin')).toBe('/admin/dashboard')
  })

  it('checks allowed roles against the current session primary role', () => {
    expect(hasAllowedRole(teacherSession, ['Teacher'])).toBe(true)
    expect(hasAllowedRole(teacherSession, ['Student'])).toBe(false)
    expect(hasAllowedRole(teacherSession, undefined)).toBe(true)
  })
})
