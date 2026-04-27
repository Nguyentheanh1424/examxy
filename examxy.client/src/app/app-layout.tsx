import { Bell, GraduationCap, LogOut, Menu } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/features/auth/auth-context'
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-unread-notification-count'
import { cn } from '@/lib/utils/cn'
import type { AppRole } from '@/types/auth'

interface NavItem {
  href: string
  label: string
  matchPrefixes: string[]
}

function getInitials(name: string | undefined) {
  if (!name) {
    return 'EX'
  }

  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part.charAt(0)).join('').toUpperCase()
}

function getRoleLabel(role: AppRole | undefined) {
  if (!role) {
    return 'Workspace'
  }

  return `${role} workspace`
}

function getNavItems(role: AppRole | undefined): NavItem[] {
  if (role === 'Teacher') {
    return [
      {
        href: '/teacher/dashboard',
        label: 'Classes',
        matchPrefixes: ['/teacher/dashboard', '/teacher/classes/', '/classes/'],
      },
      {
        href: '/teacher/question-bank',
        label: 'Question bank',
        matchPrefixes: ['/teacher/question-bank'],
      },
      {
        href: '/teacher/paper-exams',
        label: 'Paper exams',
        matchPrefixes: ['/teacher/paper-exams'],
      },
    ]
  }

  if (role === 'Student') {
    return [
      {
        href: '/student/dashboard',
        label: 'Dashboard',
        matchPrefixes: ['/student/dashboard', '/classes/'],
      },
    ]
  }

  if (role === 'Admin') {
    return [
      {
        href: '/admin/dashboard',
        label: 'Admin',
        matchPrefixes: ['/admin/dashboard'],
      },
      {
        href: '/teacher/paper-exams',
        label: 'Paper exams',
        matchPrefixes: ['/teacher/paper-exams'],
      },
    ]
  }

  return []
}

export function AppLayout() {
  const { logout, session, status } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
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
    location.pathname === path || location.pathname.startsWith(`${path}/`),
  )
  const isProtectedShell =
    !isLoginExperience && status === 'authenticated' && Boolean(session)
  const navItems = useMemo(
    () => getNavItems(session?.primaryRole),
    [session?.primaryRole],
  )
  const unreadCount = useUnreadNotificationCount(isProtectedShell)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-[-12rem] -z-10 mx-auto h-72 w-72 rounded-full bg-brand-soft blur-3xl sm:w-[28rem]" />
      <div className="absolute inset-y-0 right-[-10rem] -z-10 hidden w-80 rounded-full bg-brand/8 blur-3xl lg:block" />
      <div className="absolute bottom-[-16rem] left-[-8rem] -z-10 h-96 w-96 rounded-full bg-brand/12 blur-3xl" />

      {isLoginExperience ? (
        <main className="relative min-h-screen">
          <Outlet />
        </main>
      ) : isProtectedShell ? (
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="sticky top-4 z-30 rounded-[2rem] border border-white/75 bg-white/78 px-4 py-4 shadow-sm backdrop-blur md:px-5">
            <div className="flex items-center gap-3">
              <Link
                className="inline-flex items-center gap-3 rounded-full border border-brand/12 bg-brand-soft/70 px-4 py-2 text-sm font-semibold tracking-[0.02em] text-brand-strong transition hover:bg-brand-soft"
                to="/"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                  <GraduationCap className="size-5" />
                </span>
                examxy
              </Link>

              <Button
                className="ml-auto md:hidden"
                onClick={() => {
                  setIsMobileNavOpen((current) => !current)
                }}
                size="icon"
                variant="outline"
              >
                <Menu className="size-4" />
                <span className="sr-only">Toggle navigation</span>
              </Button>

              <div className="hidden min-w-0 flex-1 items-center justify-between gap-6 md:flex">
                <nav className="flex min-w-0 flex-wrap items-center gap-2">
                  {navItems.map((item) => {
                    const isActive = item.matchPrefixes.some((prefix) =>
                      location.pathname.startsWith(prefix),
                    )

                    return (
                      <Link
                        className={cn(
                          'rounded-full px-4 py-2 text-sm font-medium transition',
                          isActive
                            ? 'bg-brand text-white shadow-sm'
                            : 'text-muted hover:bg-brand-soft/60 hover:text-ink',
                        )}
                        key={item.href}
                        to={item.href}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>

                <div className="flex items-center gap-2">
                  <Link
                    aria-label="Notifications"
                    className="relative inline-flex size-11 items-center justify-center rounded-full border border-line/80 bg-surface text-muted transition hover:border-brand/25 hover:text-ink"
                    to="/notifications"
                  >
                    <Bell className="size-4" />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1">
                        <Badge color="error" size="sm" variant="solid">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      </span>
                    ) : null}
                  </Link>

                  <Link
                    className="inline-flex items-center gap-3 rounded-full border border-line/80 bg-surface px-2 py-1 pr-4 transition hover:border-brand/25"
                    to="/account"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(session?.userName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {session?.userName}
                      </span>
                      <span className="block truncate text-xs uppercase tracking-[0.16em] text-brand-strong">
                        {getRoleLabel(session?.primaryRole)}
                      </span>
                    </span>
                  </Link>

                  <Button
                    leftIcon={<LogOut className="size-4" />}
                    onClick={() => {
                      void handleLogout()
                    }}
                    variant="secondary"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            </div>

            {isMobileNavOpen ? (
              <div className="mt-4 border-t border-line/80 pt-4 md:hidden">
                <div className="grid gap-2">
                  {navItems.map((item) => {
                    const isActive = item.matchPrefixes.some((prefix) =>
                      location.pathname.startsWith(prefix),
                    )

                    return (
                      <Link
                        className={cn(
                          'rounded-[calc(var(--radius-input)-0.25rem)] px-4 py-3 text-sm font-medium transition',
                          isActive
                            ? 'bg-brand text-white'
                            : 'bg-surface text-ink hover:bg-brand-soft/60',
                        )}
                        key={item.href}
                        onClick={() => {
                          setIsMobileNavOpen(false)
                        }}
                        to={item.href}
                      >
                        {item.label}
                      </Link>
                    )
                  })}

                  <Link
                    className="rounded-[calc(var(--radius-input)-0.25rem)] bg-surface px-4 py-3 text-sm font-medium text-ink"
                    onClick={() => {
                      setIsMobileNavOpen(false)
                    }}
                    to="/notifications"
                  >
                    Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </Link>

                  <Link
                    className="rounded-[calc(var(--radius-input)-0.25rem)] bg-surface px-4 py-3 text-sm font-medium text-ink"
                    onClick={() => {
                      setIsMobileNavOpen(false)
                    }}
                    to="/account"
                  >
                    Account settings
                  </Link>

                  <Button
                    fullWidth
                    leftIcon={<LogOut className="size-4" />}
                    onClick={() => {
                      void handleLogout()
                    }}
                    variant="secondary"
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            ) : null}
          </header>

          <main className={cn('flex-1 py-6 sm:py-8')}>
            <Outlet />
          </main>
          <Toaster />
        </div>
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
                Pilot frontend
              </p>
              <p className="max-w-2xl text-sm leading-6 text-muted">
                Teacher and student flows now cover account, classes, content,
                notifications, and assessment workspaces on top of the existing API contracts.
              </p>
            </div>
          </header>

          <main className={cn('flex-1 py-6 sm:py-8')}>
            <Outlet />
          </main>
          <Toaster />
        </div>
      )}
    </div>
  )
}
