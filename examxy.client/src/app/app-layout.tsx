import { Bell, GraduationCap, LogOut, Menu, Settings, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import { useAuth } from '@/features/auth/auth-context'
import { getAccountProfileRequest } from '@/features/auth/lib/auth-api'
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-unread-notification-count'
import { cn } from '@/lib/utils/cn'
import type { AccountProfile, AppRole } from '@/types/auth'

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
    return 'Thành viên'
  }

  const roleNames: Record<string, string> = {
    Teacher: 'Giáo viên',
    Student: 'Học sinh',
    Admin: 'Quản trị viên',
  }

  return roleNames[role] || role
}

function getNavItems(role: AppRole | undefined): NavItem[] {
  if (role === 'Teacher') {
    return [
      {
        href: '/teacher/dashboard',
        label: 'Lớp học',
        matchPrefixes: ['/teacher/dashboard', '/teacher/classes/', '/classes/'],
      },
      {
        href: '/teacher/question-bank',
        label: 'Ngân hàng câu hỏi',
        matchPrefixes: ['/teacher/question-bank'],
      },
      {
        href: '/teacher/paper-exams',
        label: 'Đề thi giấy',
        matchPrefixes: ['/teacher/paper-exams'],
      },
    ]
  }

  if (role === 'Student') {
    return [
      {
        href: '/student/dashboard',
        label: 'Bảng điều khiển',
        matchPrefixes: ['/student/dashboard', '/classes/'],
      },
    ]
  }

  if (role === 'Admin') {
    return [
      {
        href: '/admin/dashboard',
        label: 'Quản trị',
        matchPrefixes: ['/admin/dashboard'],
      },
      {
        href: '/admin/users',
        label: 'Người dùng',
        matchPrefixes: ['/admin/users'],
      },
      {
        href: '/admin/audit',
        label: 'Nhật ký hệ thống',
        matchPrefixes: ['/admin/audit'],
      },
      {
        href: '/admin/system-health',
        label: 'Trạng thái hệ thống',
        matchPrefixes: ['/admin/system-health'],
      },
      {
        href: '/teacher/paper-exams',
        label: 'Đề thi giấy',
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
  const [profile, setProfile] = useState<AccountProfile | null>(null)
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
  const currentProfile = profile?.userId === session?.userId ? profile : null
  const displayName = currentProfile?.fullName || session?.userName || 'Account'
  const displayEmail = currentProfile?.email || session?.email || ''
  const avatarDataUrl = currentProfile?.avatarDataUrl || null
  const role = currentProfile?.primaryRole || session?.primaryRole

  useEffect(() => {
    if (!isProtectedShell) {
      return
    }

    let isMounted = true

    void (async () => {
      try {
        const nextProfile = await getAccountProfileRequest()
        if (isMounted) {
          setProfile(nextProfile)
        }
      } catch {
        if (isMounted) {
          setProfile(null)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [isProtectedShell, session?.userId])

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
          <header className="sticky top-4 z-30 rounded-[1.75rem] border border-white/75 bg-white/78 px-4 py-3.5 shadow-sm backdrop-blur md:px-5">
            <div className="flex items-center gap-3">
              <Link
                className="inline-flex items-center gap-2.5 rounded-xl border border-brand/8 bg-brand-soft/50 px-3 py-1.5 text-sm font-bold tracking-tight text-brand-strong transition hover:bg-brand-soft/80"
                to="/"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-white text-brand shadow-sm">
                  <GraduationCap className="size-4.5" />
                </span>
                examxy
              </Link>

              <div className="mx-2 hidden h-6 w-px bg-line/60 md:block" />

              <Button
                className="ml-auto md:hidden"
                onClick={() => {
                  setIsMobileNavOpen((current) => !current)
                }}
                size="icon"
                variant="outline"
              >
                <Menu className="size-4" />
                <span className="sr-only">Bật/tắt điều hướng</span>
              </Button>

              <div className="hidden min-w-0 flex-1 items-center justify-between gap-6 md:flex">
                <nav className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {navItems.map((item) => {
                    const isActive = item.matchPrefixes.some((prefix) =>
                      location.pathname.startsWith(prefix),
                    )

                    return (
                      <Link
                        className={cn(
                          'rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-brand text-white shadow-sm shadow-brand/20'
                            : 'text-muted-foreground hover:bg-brand-soft/50 hover:text-ink',
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
                    aria-label="Thông báo"
                    className="relative inline-flex size-10 items-center justify-center rounded-xl border border-line/60 bg-surface text-muted-foreground transition-colors hover:border-brand/30 hover:bg-brand-soft/30 hover:text-ink"
                    to="/notifications"
                  >
                    <Bell className="size-4.5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-strong opacity-20"></span>
                        <Badge className="relative size-4.5 min-w-0 p-0 text-[10px]" color="error" size="sm" variant="solid">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      </span>
                    ) : null}
                  </Link>

                  <DropdownMenu align="end">
                    <DropdownMenuTrigger className="inline-flex min-h-10 items-center gap-2.5 rounded-xl border border-line/60 bg-surface py-1 pl-1.5 pr-3 text-left transition-colors hover:border-brand/30 hover:bg-brand-soft/30">
                      <Avatar className="size-7">
                        {avatarDataUrl ? (
                          <AvatarImage alt={displayName} src={avatarDataUrl} />
                        ) : (
                          <AvatarFallback className="text-[10px]">{getInitials(displayName)}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold leading-none text-ink">
                          {displayName}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-wider text-brand-strong/80">
                          {getRoleLabel(role)}
                        </span>
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
                      <Link to="/account/profile">
                        <DropdownMenuItem>
                          <UserRound className="size-4 text-brand-strong" />
                          Cài đặt tài khoản
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/account/security">
                        <DropdownMenuItem>
                          <Settings className="size-4 text-brand-strong" />
                          Bảo mật
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          void handleLogout()
                        }}
                      >
                        <LogOut className="size-4 text-brand-strong" />
                        Đăng xuất
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {isMobileNavOpen ? (
              <div className="mt-4 border-t border-line/80 pt-4 md:hidden">
                <div className="grid gap-4">
                  <nav aria-label="Điều hướng di động" className="grid gap-2">
                    {navItems.map((item) => {
                      const isActive = item.matchPrefixes.some((prefix) =>
                        location.pathname.startsWith(prefix),
                      )

                      return (
                        <Link
                          className={cn(
                            'rounded-xl px-4 py-3 text-sm font-medium transition',
                            isActive
                              ? 'bg-brand text-white shadow-sm shadow-brand/20'
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
                  </nav>

                  <div aria-label="Tiện ích di động" className="grid gap-2">
                    <Link
                      className="flex min-h-11 items-center justify-between rounded-xl bg-surface px-4 py-3 text-sm font-medium text-ink"
                      onClick={() => {
                        setIsMobileNavOpen(false)
                      }}
                      to="/notifications"
                    >
                      <span>Thông báo</span>
                      {unreadCount > 0 ? (
                        <Badge color="error" size="sm" variant="solid">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        {avatarDataUrl ? (
                          <AvatarImage alt={displayName} src={avatarDataUrl} />
                        ) : (
                          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">
                          {displayName}
                        </p>
                        {displayEmail ? (
                          <p className="truncate text-xs text-muted">{displayEmail}</p>
                        ) : null}
                        <p className="truncate text-[10px] font-medium uppercase tracking-wider text-brand-strong/80">
                          {getRoleLabel(role)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <Link
                        className="rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-brand-soft/60"
                        onClick={() => {
                          setIsMobileNavOpen(false)
                        }}
                        to="/account/profile"
                      >
                        Cài đặt tài khoản
                      </Link>
                      <Button
                        className="rounded-lg"
                        fullWidth
                        leftIcon={<LogOut className="size-4" />}
                        onClick={() => {
                          void handleLogout()
                        }}
                        variant="secondary"
                      >
                        Đăng xuất
                      </Button>
                    </div>
                  </div>
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
          <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/70 bg-white/70 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
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
                Giao diện thử nghiệm
              </p>
              <p className="max-w-2xl text-sm leading-6 text-muted">
                Luồng giáo viên và học sinh hiện đã hỗ trợ tài khoản, lớp học, nội dung,
                thông báo và không gian kiểm tra trên các API hiện có.
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
