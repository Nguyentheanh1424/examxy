import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/auth-context'
import { getDefaultRouteForSession, hasAllowedRole } from '@/features/auth/lib/auth-role-routing'
import type { AppRole } from '@/types/auth'

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: AppRole[]
}

export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { session, status } = useAuth()
  const location = useLocation()

  if (status === 'bootstrapping') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Restoring your session...
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/login"
      />
    )
  }

  if (!hasAllowedRole(session, allowedRoles)) {
    return <Navigate replace to={getDefaultRouteForSession(session)} />
  }

  return children
}
