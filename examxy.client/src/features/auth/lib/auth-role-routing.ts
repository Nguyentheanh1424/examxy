import type { AppRole, AuthSession } from '@/types/auth'

export function getDefaultRouteForRole(role: AppRole) {
  switch (role) {
    case 'Admin':
      return '/admin/dashboard'
    case 'Student':
      return '/student/dashboard'
    case 'Teacher':
    default:
      return '/teacher/dashboard'
  }
}

export function getDefaultRouteForSession(session: AuthSession | null) {
  return session ? getDefaultRouteForRole(session.primaryRole) : '/login'
}

export function hasAllowedRole(
  session: AuthSession | null,
  allowedRoles?: AppRole[],
) {
  if (!session) {
    return false
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  return allowedRoles.includes(session.primaryRole)
}
