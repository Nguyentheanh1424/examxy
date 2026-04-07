import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/auth-context'

export function ProtectedRoute({ children }: PropsWithChildren) {
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

  return children
}
