import { GraduationCap } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils/cn'

export function AppLayout() {
  const location = useLocation()
  const authPaths = [
    '/login',
    '/register',
    '/student/register',
    '/forgot-password',
    '/resend-email-confirmation',
    '/confirm-email',
    '/reset-password',
  ]
  const isLoginExperience = authPaths.some((path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  )

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-[-12rem] -z-10 mx-auto h-72 w-72 rounded-full bg-brand-soft blur-3xl sm:w-[28rem]" />
      <div className="absolute inset-y-0 right-[-10rem] -z-10 hidden w-80 rounded-full bg-brand/8 blur-3xl lg:block" />
      <div className="absolute bottom-[-16rem] left-[-8rem] -z-10 h-96 w-96 rounded-full bg-brand/12 blur-3xl" />

      {isLoginExperience ? (
        <main className="relative min-h-screen">
          <Outlet />
        </main>
      ) : (
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <Link
              className="inline-flex items-center gap-3 self-start rounded-full border border-brand/12 bg-brand-soft/70 px-4 py-2 text-sm font-semibold tracking-[0.02em] text-brand-strong transition hover:bg-brand-soft"
              to="/"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                <GraduationCap className="size-5" />
              </span>
              examxy.client
            </Link>

            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Frontend foundation v1
              </p>
              <p className="max-w-2xl text-sm leading-6 text-muted">
                Authentication shell aligned with the existing ASP.NET Identity,
                token refresh, and API error contracts.
              </p>
            </div>
          </header>

          <main className={cn('flex-1 py-6 sm:py-8')}>
            <Outlet />
          </main>
        </div>
      )}
    </div>
  )
}
