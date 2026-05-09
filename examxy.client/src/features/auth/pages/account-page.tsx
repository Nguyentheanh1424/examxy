import type { FormEvent } from 'react'
import { useEffect, useState, useRef } from 'react'
import {
  BadgeCheck,
  Bell,
  Camera,
  ChevronRight,
  Clock,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Phone,
  ShieldCheck,
  Smartphone,
  User,
  XCircle,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { useAuth } from '@/features/auth/auth-context'
import {
  changePasswordRequest,
  deleteAccountAvatarRequest,
  getAccountAvatarUrl,
  getAccountNotificationPreferencesRequest,
  getAccountProfileRequest,
  getAccountSessionsRequest,
  revokeAccountSessionRequest,
  revokeOtherAccountSessionsRequest,
  updateAccountAvatarRequest,
  updateAccountNotificationPreferencesRequest,
  updateAccountProfileRequest,
} from '@/features/auth/lib/auth-api'
import {
  hasFieldErrors,
  validateChangePassword,
} from '@/features/auth/lib/validation'
import { getErrorMessage, getFieldErrors } from '@/lib/http/api-error'
import { cn } from '@/lib/utils/cn'
import { writeFlashNotice } from '@/lib/utils/flash-notice'
import type {
  AccountNotificationPreference,
  AccountProfile,
  AccountSession,
  ChangePasswordRequest,
} from '@/types/auth'

// --- Helpers ---

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

interface AccountPanelFrameProps {
  children: React.ReactNode
  description: string
  title: string
  headerExtra?: React.ReactNode
}

function AccountPanelFrame({
  children,
  description,
  title,
  headerExtra,
}: AccountPanelFrameProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardShell className="overflow-hidden border-brand/10 bg-white/70 shadow-xl shadow-brand/5 backdrop-blur-xl">
        <div className="relative px-6 py-8 sm:px-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-ink">
                {title}
              </h2>
              <p className="text-muted/80">{description}</p>
            </div>
            {headerExtra}
          </div>

          <Separator className="my-8 bg-brand/10" />

          <div className="space-y-8">{children}</div>
        </div>
      </CardShell>
    </div>
  )
}

// --- Main Layout ---

export function AccountPage() {
  const { logout, session } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navItems = [
    { icon: User, label: 'Thông tin hồ sơ', to: 'profile' },
    { icon: ShieldCheck, label: 'Bảo mật tài khoản', to: 'security' },
    { icon: Monitor, label: 'Thiết bị & Phiên', to: 'sessions' },
    { icon: Bell, label: 'Tùy chọn thông báo', to: 'notifications' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-4">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-6 lg:w-72">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Cài đặt tài khoản
            </h1>
            <p className="text-sm text-muted">Quản lý danh tính và bảo mật</p>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand/10 text-brand-strong shadow-sm'
                      : 'text-muted hover:bg-brand/5 hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'size-4.5 transition-transform group-hover:scale-110',
                          isActive ? 'text-brand-strong' : 'text-muted/60',
                        )}
                      />
                      {item.label}
                    </div>
                    {isActive && (
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-strong" />
                    )}
                    {!isActive && (
                      <ChevronRight className="size-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <Separator className="bg-brand/5" />

          <div className="rounded-3xl border border-brand/5 bg-brand-soft/30 p-5 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl bg-brand/20 text-brand-strong">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-strong/70">
                    Phiên làm việc
                  </p>
                  <p className="text-[10px] text-muted/70">
                    Hết hạn: {session ? formatUtcDate(session.expiresAtUtc) : '---'}
                  </p>
                </div>
              </div>

              <Button
                fullWidth
                isLoading={isLoggingOut}
                leftIcon={<LogOut className="size-4" />}
                onClick={handleLogout}
                size="sm"
                variant="ghost"
                className="justify-start text-muted hover:bg-red-50 hover:text-red-600"
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// --- Panels ---

export function AccountProfilePanel() {
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getAccountProfileRequest()
        setProfile(data)
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải thông tin hồ sơ.'))
      } finally {
        setIsLoading(false)
      }
    }
    void loadProfile()
  }, [])

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault()
    if (!profile) return

    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateAccountProfileRequest({
        fullName: profile.fullName,
        bio: profile.bio,
        phoneNumber: profile.phoneNumber,
        timeZoneId: profile.timeZoneId,
      })
      setProfile(updated)
      writeFlashNotice({
        message: 'Thông tin cá nhân đã được cập nhật.',
        tone: 'success',
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Lỗi khi cập nhật hồ sơ.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUpdatingAvatar(true)
    try {
      const updated = await updateAccountAvatarRequest(file)
      setProfile(updated)
      writeFlashNotice({
        message: 'Ảnh đại diện đã được cập nhật.',
        tone: 'success',
      })
    } catch (err) {
      writeFlashNotice({
        message: getErrorMessage(err, 'Lỗi khi tải lên ảnh đại diện.'),
        tone: 'error',
      })
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  async function handleDeleteAvatar() {
    if (!profile?.avatarUrl && !profile?.avatarDataUrl) return
    if (!confirm('Bạn có chắc muốn xóa ảnh đại diện?')) return

    setIsUpdatingAvatar(true)
    try {
      await deleteAccountAvatarRequest()
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null, avatarDataUrl: null } : null))
      writeFlashNotice({
        message: 'Đã xóa ảnh đại diện.',
        tone: 'success',
      })
    } catch (err) {
      writeFlashNotice({
        message: getErrorMessage(err, 'Lỗi khi xóa ảnh đại diện.'),
        tone: 'error',
      })
    } finally {
      setIsUpdatingAvatar(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (!profile) {
    return <Notice tone="error" title="Lỗi">{error}</Notice>
  }

  const timeZones = [
    { label: '(UTC+07:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Ho_Chi_Minh' },
    { label: '(UTC+08:00) Singapore, Kuala Lumpur', value: 'Asia/Singapore' },
    { label: '(UTC+09:00) Tokyo, Seoul', value: 'Asia/Tokyo' },
    { label: '(UTC+00:00) London, Lisbon, Casablanca', value: 'Europe/London' },
    { label: '(UTC+01:00) Paris, Berlin, Rome, Madrid', value: 'Europe/Paris' },
    { label: '(UTC-05:00) Eastern Time (US & Canada)', value: 'America/New_York' },
    { label: '(UTC-08:00) Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
  ]

  return (
    <AccountPanelFrame
      title="Hồ sơ cá nhân"
      description="Cập nhật thông tin công khai và ảnh đại diện của bạn."
    >
      <div className="relative">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
          <div className="group relative">
            <Avatar noBorder className="size-32 border-4 border-white shadow-2xl ring-1 ring-brand/10 transition-transform duration-300 group-hover:scale-105 sm:size-40">
              <AvatarImage 
                src={profile.avatarDataUrl || (profile.avatarUrl ? `${getAccountAvatarUrl()}?v=${profile.avatarUrl}` : undefined)} 
                alt={profile.fullName}
              />
              <AvatarFallback className="bg-brand-soft text-3xl font-bold text-brand-strong">
                {profile.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUpdatingAvatar}
                className="flex flex-col items-center gap-1 text-xs font-bold text-white transition-transform hover:scale-110"
              >
                <Camera className="size-6" />
                Thay đổi
              </button>
            </div>
            {isUpdatingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-[2px]">
                <Spinner />
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-2 sm:items-start sm:pb-2">
            <h3 className="text-2xl font-bold text-ink">{profile.fullName}</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.emailConfirmed && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <BadgeCheck className="mr-1 size-3" />
                  Đã xác minh
                </Badge>
              )}
            </div>
            {(profile.avatarUrl || profile.avatarDataUrl) && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                className="mt-1 text-xs font-medium text-red-500 hover:text-red-600 hover:underline"
              >
                Xóa ảnh đại diện
              </button>
            )}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarChange}
        />
      </div>

      {error && <Notice tone="error" title="Lỗi">{error}</Notice>}

      <form onSubmit={handleUpdateProfile} className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <TextField
            label="Họ và tên"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            placeholder="Nhập tên đầy đủ của bạn"
            leftIcon={<User className="size-4" />}
            required
          />
        </div>
        <div className="sm:col-span-1">
          <TextField
            label="Tên đăng nhập"
            value={profile.userName}
            readOnly
            disabled
            leftIcon={<User className="size-4" />}
          />
        </div>
        <div className="sm:col-span-1">
          <TextField
            label="Địa chỉ email"
            value={profile.email}
            readOnly
            disabled
            leftIcon={<Mail className="size-4" />}
          />
        </div>
        <div className="sm:col-span-1">
          <TextField
            label="Số điện thoại"
            value={profile.phoneNumber}
            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
            placeholder="Ví dụ: 0912 345 678"
            leftIcon={<Phone className="size-4" />}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="space-y-2">
            <label className="block text-base font-medium tracking-[0.01em] text-ink">
              Múi giờ
            </label>
            <Select
              value={profile.timeZoneId}
              onValueChange={(value) => setProfile({ ...profile, timeZoneId: value })}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted" />
                  <SelectValue placeholder="Chọn múi giờ của bạn" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {timeZones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <TextareaField
            label="Tiểu sử"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Giới thiệu ngắn về bản thân bạn..."
            rows={4}
          />
        </div>

        <div className="flex justify-end pt-4 sm:col-span-2">
          <Button type="submit" isLoading={isSaving} size="lg" className="min-w-40 rounded-2xl shadow-lg shadow-brand/20">
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </AccountPanelFrame>
  )
}

export function AccountSecurityPanel() {
  const { signOutLocal } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ChangePasswordRequest, string>>>({})

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault()
    const nextFieldErrors = validateChangePassword(form)
    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setIsSaving(true)
    setError(null)
    setFieldErrors({})

    try {
      await changePasswordRequest(form)
      writeFlashNotice({
        message: 'Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.',
        tone: 'success',
      })
      signOutLocal()
      navigate('/login', { replace: true })
    } catch (err) {
      setFieldErrors(getFieldErrors(err) as any)
      setError(getErrorMessage(err, 'Lỗi khi cập nhật mật khẩu.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AccountPanelFrame
      title="Bảo mật"
      description="Thay đổi mật khẩu để bảo vệ tài khoản của bạn."
    >
      <div className="max-w-xl space-y-6">
        <Notice tone="warning" title="Lưu ý quan trọng">
          Sau khi đổi mật khẩu thành công, tất cả các phiên đăng nhập khác của bạn sẽ bị vô hiệu hóa và bạn cần đăng nhập lại.
        </Notice>

        {error && <Notice tone="error" title="Lỗi">{error}</Notice>}

        <form onSubmit={handlePasswordChange} className="space-y-5">
          <TextField
            label="Mật khẩu hiện tại"
            type="password"
            value={form.currentPassword}
            error={fieldErrors.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            placeholder="••••••••"
            leftIcon={<KeyRound className="size-4" />}
            required
          />
          <Separator className="my-4 bg-brand/5" />
          <TextField
            label="Mật khẩu mới"
            type="password"
            value={form.newPassword}
            error={fieldErrors.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            placeholder="••••••••"
            leftIcon={<KeyRound className="size-4" />}
            required
          />
          <TextField
            label="Xác nhận mật khẩu mới"
            type="password"
            value={form.confirmNewPassword}
            error={fieldErrors.confirmNewPassword}
            onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
            placeholder="••••••••"
            leftIcon={<KeyRound className="size-4" />}
            required
          />

          <div className="pt-4">
            <Button type="submit" isLoading={isSaving} fullWidth size="lg" className="rounded-2xl shadow-lg shadow-brand/20">
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </div>
    </AccountPanelFrame>
  )
}

export function AccountSessionsPanel() {
  const [sessions, setSessions] = useState<AccountSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getAccountSessionsRequest()
        setSessions(data)
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải danh sách phiên đăng nhập.'))
      } finally {
        setIsLoading(false)
      }
    }
    void loadSessions()
  }, [])

  async function handleRevokeSession(id: string) {
    if (!confirm('Bạn có muốn đăng xuất khỏi thiết bị này?')) return
    try {
      await revokeAccountSessionRequest(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      writeFlashNotice({ message: 'Đã vô hiệu hóa phiên đăng nhập.', tone: 'success' })
    } catch (err) {
      writeFlashNotice({ message: getErrorMessage(err, 'Không thể vô hiệu hóa phiên.'), tone: 'error' })
    }
  }

  async function handleRevokeOthers() {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác?')) return
    setIsRevokingAll(true)
    try {
      await revokeOtherAccountSessionsRequest()
      setSessions((prev) => prev.filter((s) => s.isCurrent))
      writeFlashNotice({ message: 'Đã đăng xuất khỏi các thiết bị khác.', tone: 'success' })
    } catch (err) {
      writeFlashNotice({ message: getErrorMessage(err, 'Lỗi khi vô hiệu hóa các phiên.'), tone: 'error' })
    } finally {
      setIsRevokingAll(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <AccountPanelFrame
      title="Phiên đăng nhập"
      description="Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn."
      headerExtra={
        sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeOthers}
            isLoading={isRevokingAll}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            Đăng xuất các thiết bị khác
          </Button>
        )
      }
    >
      {error && <Notice tone="error" title="Lỗi">{error}</Notice>}

      <div className="space-y-10">
        {/* Active Sessions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-brand/5 pb-2">
            <BadgeCheck className="size-5 text-brand-strong" />
            <h3 className="text-lg font-bold text-ink">Thiết bị đang hoạt động</h3>
          </div>
          
          <div className="grid gap-4">
            {sessions.filter(s => !s.isRevoked).map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center justify-between rounded-3xl border p-5 transition-all duration-300',
                  session.isCurrent ? 'border-brand/20 bg-brand-soft/30' : 'border-brand/10 bg-white hover:border-brand/20 hover:shadow-md'
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    'flex size-14 items-center justify-center rounded-2xl shadow-inner',
                    session.isCurrent ? 'bg-brand/20 text-brand-strong' : 'bg-brand/5 text-muted'
                  )}>
                    {session.deviceType === 'Phone' ? <Smartphone className="size-7" /> : <Monitor className="size-7" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-ink">{session.device} • {session.browser}</h4>
                      {session.isCurrent && (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Thiết bị hiện tại</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted/80">
                      <span className="flex items-center gap-1"><MapPin className="size-3" /> {session.location} ({session.ipAddress})</span>
                      <span className="flex items-center gap-1" title="Thời gian bắt đầu phiên"><Clock className="size-3" /> Đăng nhập: {formatUtcDate(session.createdAtUtc)}</span>
                      <span className="flex items-center gap-1" title="Lần cuối hệ thống ghi nhận hoạt động"><div className="size-1.5 rounded-full bg-green-500 animate-pulse" /> Hoạt động cuối: {formatUtcDate(session.lastActiveAtUtc)}</span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="flex size-10 items-center justify-center rounded-xl text-muted/40 transition-all hover:bg-red-50 hover:text-red-500 group-hover:bg-red-50/50"
                    title="Đăng xuất thiết bị này"
                  >
                    <XCircle className="size-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* History Sessions */}
        {sessions.some(s => s.isRevoked) && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-brand/5 pb-2">
              <Clock className="size-5 text-muted" />
              <h3 className="text-lg font-bold text-ink opacity-60">Lịch sử đăng nhập</h3>
            </div>
            
            <div className="grid gap-3 opacity-70">
              {sessions.filter(s => s.isRevoked).sort((a, b) => new Date(b.lastActiveAtUtc).getTime() - new Date(a.lastActiveAtUtc).getTime()).slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-panel/20 p-4 text-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted/10 text-muted/60">
                      {session.deviceType === 'Phone' ? <Smartphone className="size-5" /> : <Monitor className="size-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-ink/80">{session.device} • {session.browser}</p>
                      <p className="text-xs text-muted/60">
                        {session.ipAddress} • Đăng nhập {formatUtcDate(session.createdAtUtc)} • Kết thúc {formatUtcDate(session.lastActiveAtUtc)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider opacity-50">Đã hết hạn</Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AccountPanelFrame>
  )
}

export function AccountNotificationsPanel() {
  const [preferences, setPreferences] = useState<AccountNotificationPreference[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadPrefs() {
      try {
        const data = await getAccountNotificationPreferencesRequest()
        setPreferences(data)
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải tùy chọn thông báo.'))
      } finally {
        setIsLoading(false)
      }
    }
    void loadPrefs()
  }, [])

  async function handleToggle(id: string, currentEnabled: boolean) {
    setUpdatingId(id)
    try {
      const updatedPrefs = preferences.map(p => p.id === id ? { ...p, enabled: !currentEnabled } : p)
      const result = await updateAccountNotificationPreferencesRequest({ preferences: updatedPrefs })
      setPreferences(result)
    } catch (err) {
      writeFlashNotice({ message: getErrorMessage(err, 'Lỗi khi cập nhật thông báo.'), tone: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  const channels = [
    { key: 'Email', label: 'Email', icon: Mail },
    { key: 'InApp', label: 'Trong ứng dụng', icon: Bell },
  ]

  return (
    <AccountPanelFrame
      title="Thông báo"
      description="Tùy chỉnh cách bạn nhận thông báo từ hệ thống."
    >
      {error && <Notice tone="error" title="Lỗi">{error}</Notice>}

      <div className="space-y-8">
        {channels.map((channel) => (
          <div key={channel.key} className="space-y-4">
            <div className="flex items-center gap-2 pb-2">
              <channel.icon className="size-5 text-brand-strong" />
              <h3 className="text-lg font-bold text-ink">{channel.label}</h3>
            </div>
            <div className="grid gap-3">
              {preferences
                .filter((p) => p.channel === channel.key)
                .map((pref) => (
                  <div
                    key={pref.id}
                    className="flex items-center justify-between rounded-2xl border border-brand/5 bg-white p-5 transition-all hover:border-brand/10 hover:shadow-sm"
                  >
                    <div className="space-y-0.5">
                      <label htmlFor={pref.id} className="text-sm font-semibold cursor-pointer text-ink">{pref.label}</label>
                      <p className="text-xs text-muted/70">Nhận thông báo khi {pref.label.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {updatingId === pref.id && <Spinner size={16} />}
                      <Switch
                        id={pref.id}
                        checked={pref.enabled}
                        disabled={updatingId === pref.id}
                        onChange={() => handleToggle(pref.id, pref.enabled)}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </AccountPanelFrame>
  )
}
