import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Clock3,
  KeyRound,
  LogOut,
  Mail,
  RefreshCcw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/ui/text-field'
import { useAuth } from '@/features/auth/auth-context'
import {
  changePasswordRequest,
  getCurrentUserRequest,
} from '@/features/auth/lib/auth-api'
import {
  hasFieldErrors,
  validateChangePassword,
} from '@/features/auth/lib/validation'
import { getErrorMessage, getFieldErrors } from '@/lib/http/api-error'
import { writeFlashNotice } from '@/lib/utils/flash-notice'
import type { ChangePasswordRequest, CurrentUser } from '@/types/auth'

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AccountPage() {
  const { logout, session, signOutLocal } = useAuth()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    confirmNewPassword: '',
    currentPassword: '',
    newPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ChangePasswordRequest, string>>
  >({})
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const nextUser = await getCurrentUserRequest()

        if (isMounted) {
          setCurrentUser(nextUser)
        }
      } catch (error) {
        if (isMounted) {
          setProfileError(
            getErrorMessage(error, 'We could not load your account details.'),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
      setIsLoggingOut(false)
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFieldErrors = validateChangePassword(passwordForm)

    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setIsSavingPassword(true)
    setPasswordError(null)

    try {
      await changePasswordRequest(passwordForm)
      writeFlashNotice({
        message: 'Your password was updated. Sign in again with the new one.',
        title: 'Password changed',
        tone: 'success',
      })
      signOutLocal()
      navigate('/login', { replace: true })
    } catch (error) {
      setFieldErrors(
        getFieldErrors(error) as Partial<Record<keyof ChangePasswordRequest, string>>,
      )
      setPasswordError(getErrorMessage(error, 'Unable to change your password.'))
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <CardShell className="overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Account workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-ink">
              Your authentication control center
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">
              Review the current signed-in identity, check email confirmation,
              rotate your password, and clear the session cleanly from the
              client.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-[calc(var(--radius-panel)-0.5rem)] border border-brand/12 bg-brand-soft/55 p-5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-strong">
                Session summary
              </p>
              <p className="text-sm leading-6 text-muted">
                Access token expires at {session ? formatUtcDate(session.expiresAtUtc) : 'unknown'}.
              </p>
            </div>

            <Button
              fullWidth
              isLoading={isLoggingOut}
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
      </CardShell>

      {currentUser && !currentUser.emailConfirmed ? (
        <Notice
          actions={
            <Link
              className="font-semibold text-brand-strong transition hover:text-brand"
              to={`/resend-email-confirmation?email=${encodeURIComponent(currentUser.email)}`}
            >
              Resend confirmation email
            </Link>
          }
          tone="warning"
          title="Email confirmation still pending"
        >
          Your account is signed in, but fresh logins remain blocked until the
          email address is confirmed.
        </Notice>
      ) : null}

      {profileError ? (
        <Notice
          actions={
            <button
              className="cursor-pointer font-semibold text-brand-strong transition hover:text-brand"
              onClick={() => {
                window.location.reload()
              }}
              type="button"
            >
              Reload page
            </button>
          }
          tone="error"
          title="Unable to load account details"
        >
          {profileError}
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-6">
            <header className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Current user
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Identity snapshot
              </h2>
            </header>

            {isLoadingUser ? (
              <div className="flex min-h-40 items-center justify-center">
                <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
                  <Spinner />
                  Loading your account...
                </div>
              </div>
            ) : null}

            {currentUser ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-line bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <UserRound className="size-4 text-brand-strong" />
                    Username
                  </p>
                  <p className="mt-2 text-base text-muted">{currentUser.userName}</p>
                </div>

                <div className="rounded-3xl border border-line bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Mail className="size-4 text-brand-strong" />
                    Email
                  </p>
                  <p className="mt-2 text-base text-muted">{currentUser.email}</p>
                </div>

                <div className="rounded-3xl border border-line bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <BadgeCheck className="size-4 text-brand-strong" />
                    Confirmation status
                  </p>
                  <p className="mt-2 text-base text-muted">
                    {currentUser.emailConfirmed ? 'Confirmed' : 'Awaiting confirmation'}
                  </p>
                </div>

                <div className="rounded-3xl border border-line bg-surface p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <ShieldCheck className="size-4 text-brand-strong" />
                    Roles
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentUser.roles.map((role) => (
                      <span
                        className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong"
                        key={role}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CardShell>

        <div className="space-y-6">
          <CardShell className="p-6 sm:p-8">
            <div className="space-y-4">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Session details
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Client-side persistence
                </h2>
              </header>

              <div className="rounded-3xl border border-line bg-surface p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Clock3 className="size-4 text-brand-strong" />
                  Access token expiry
                </p>
                <p className="mt-2 text-base text-muted">
                  {session ? formatUtcDate(session.expiresAtUtc) : 'Unknown'}
                </p>
              </div>

              <div className="rounded-3xl border border-line bg-surface p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <RefreshCcw className="size-4 text-brand-strong" />
                  Storage strategy
                </p>
                <p className="mt-2 text-base leading-7 text-muted">
                  The client keeps the current token pair in localStorage and
                  refreshes automatically on the next protected request when a
                  401 occurs.
                </p>
              </div>
            </div>
          </CardShell>

          <CardShell className="p-6 sm:p-8">
            <div className="space-y-6">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Security
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Change password
                </h2>
                <p className="text-sm leading-6 text-muted">
                  Successful password changes revoke active refresh tokens, so
                  the client signs you out immediately after the update.
                </p>
              </header>

              {passwordError ? (
                <Notice tone="error" title="Unable to change password">
                  {passwordError}
                </Notice>
              ) : null}

              <form className="space-y-5" onSubmit={handleChangePassword}>
                <TextField
                  autoComplete="current-password"
                  error={fieldErrors.currentPassword}
                  label="Current password"
                  leftIcon={<KeyRound className="size-4" />}
                  onChange={(event) => {
                    setPasswordForm((currentState) => ({
                      ...currentState,
                      currentPassword: event.target.value,
                    }))
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      currentPassword: undefined,
                    }))
                    setPasswordError(null)
                  }}
                  placeholder="Enter your current password"
                  type="password"
                  value={passwordForm.currentPassword}
                />

                <TextField
                  autoComplete="new-password"
                  error={fieldErrors.newPassword}
                  label="New password"
                  leftIcon={<KeyRound className="size-4" />}
                  onChange={(event) => {
                    setPasswordForm((currentState) => ({
                      ...currentState,
                      newPassword: event.target.value,
                    }))
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      newPassword: undefined,
                    }))
                    setPasswordError(null)
                  }}
                  placeholder="Enter a new password"
                  type="password"
                  value={passwordForm.newPassword}
                />

                <TextField
                  autoComplete="new-password"
                  error={fieldErrors.confirmNewPassword}
                  label="Confirm new password"
                  leftIcon={<KeyRound className="size-4" />}
                  onChange={(event) => {
                    setPasswordForm((currentState) => ({
                      ...currentState,
                      confirmNewPassword: event.target.value,
                    }))
                    setFieldErrors((currentErrors) => ({
                      ...currentErrors,
                      confirmNewPassword: undefined,
                    }))
                    setPasswordError(null)
                  }}
                  placeholder="Repeat the new password"
                  type="password"
                  value={passwordForm.confirmNewPassword}
                />

                <Button
                  fullWidth
                  isLoading={isSavingPassword}
                  leftIcon={<ShieldCheck className="size-4" />}
                  size="lg"
                  type="submit"
                >
                  Update password
                </Button>
              </form>
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  )
}
