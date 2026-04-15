import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { GraduationCap, KeyRound, RefreshCcw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/ui/text-field'
import {
  claimStudentInviteRequest,
  getStudentDashboardRequest,
} from '@/features/classrooms/lib/class-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type { StudentDashboard } from '@/types/classroom'

function formatUtcDate(value: string | null) {
  if (!value) {
    return 'Not yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function StudentDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null)
  const [inviteCode, setInviteCode] = useState(searchParams.get('inviteCode') ?? '')
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [claimNotice, setClaimNotice] = useState<{
    tone: 'error' | 'success'
    title: string
    message: string
  } | null>(null)
  const [hasAutoClaimed, setHasAutoClaimed] = useState(false)

  const loadDashboard = useCallback(async () => {
    const response = await getStudentDashboardRequest()
    setDashboard(response)
  }, [])

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const response = await getStudentDashboardRequest()
        if (isMounted) {
          setDashboard(response)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(getErrorMessage(nextError, 'Unable to load the student dashboard.'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const claimInvite = useCallback(async (nextInviteCode: string) => {
    setIsClaiming(true)
    setClaimNotice(null)

    try {
      const response = await claimStudentInviteRequest({
        inviteCode: nextInviteCode,
      })

      await loadDashboard()
      setClaimNotice({
        tone: 'success',
        title: 'Class joined',
        message: `You joined ${response.className} (${response.classCode}).`,
      })
      setInviteCode('')
      setSearchParams({})
    } catch (nextError) {
      setClaimNotice({
        tone: 'error',
        title: 'Invite claim failed',
        message: getErrorMessage(nextError, 'Unable to claim this invite code.'),
      })
    } finally {
      setIsClaiming(false)
    }
  }, [loadDashboard, setSearchParams])

  useEffect(() => {
    const inviteCodeFromUrl = searchParams.get('inviteCode')
    if (!inviteCodeFromUrl || hasAutoClaimed || isLoading) {
      return
    }

    setHasAutoClaimed(true)
    setInviteCode(inviteCodeFromUrl)
    void claimInvite(inviteCodeFromUrl)
  }, [claimInvite, hasAutoClaimed, isLoading, searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!inviteCode.trim()) {
      setClaimNotice({
        tone: 'error',
        title: 'Invite code required',
        message: 'Enter a valid invite code before trying again.',
      })
      return
    }

    await claimInvite(inviteCode.trim().toUpperCase())
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading your dashboard...
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <Notice tone="error" title="Unable to load dashboard">
        {error ?? 'Student dashboard is unavailable right now.'}
      </Notice>
    )
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Student dashboard
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                Welcome, {dashboard.fullName || dashboard.userName}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Track your joined classes, pending invites, and enter a one-time
                class code whenever a teacher sends one.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/account">
              <Button variant="secondary">Account settings</Button>
            </Link>
          </div>
        </div>
      </CardShell>

      {claimNotice ? (
        <Notice tone={claimNotice.tone} title={claimNotice.title}>
          {claimNotice.message}
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-5">
            <header className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Join a class
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Claim an invite code
              </h2>
              <p className="text-base leading-7 text-muted">
                The code is bound to your invited email address and can only be used
                once.
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField
                label="Invite code"
                leftIcon={<KeyRound className="size-4" />}
                onChange={(event) => {
                  setInviteCode(event.target.value)
                }}
                placeholder="Enter invite code"
                value={inviteCode}
              />

              <Button fullWidth isLoading={isClaiming} type="submit">
                Join class
              </Button>
            </form>

            <div className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Profile snapshot</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Email: {dashboard.email}
                <br />
                Student code: {dashboard.studentCode || 'Not set'}
                <br />
                Onboarding: {dashboard.onboardingState}
              </p>
            </div>
          </div>
        </CardShell>

        <div className="space-y-6">
          <CardShell className="p-6 sm:p-8">
            <div className="space-y-4">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Active classes
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Your joined classes
                </h2>
              </header>

              {dashboard.classes.length === 0 ? (
                <div className="rounded-3xl border border-line bg-surface p-5">
                  <p className="flex items-center gap-2 text-base font-semibold text-ink">
                    <GraduationCap className="size-5 text-brand-strong" />
                    No classes joined yet
                  </p>
                  <p className="mt-2 text-base leading-7 text-muted">
                    Enter an invite code from your teacher to populate this space.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.classes.map((item) => (
                    <div
                      className="rounded-3xl border border-line bg-surface p-4"
                      key={item.id}
                    >
                      <p className="text-base font-semibold text-ink">
                        {item.name}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Code {item.code}. Class status: {item.status}. Membership:
                        {' '}
                        {item.membershipStatus}. Joined {formatUtcDate(item.joinedAtUtc)}.
                      </p>
                      <div className="mt-3">
                        <Link to={`/classes/${item.id}`}>
                          <Button size="md" variant="secondary">
                            Open class
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardShell>

          <CardShell className="p-6 sm:p-8">
            <div className="space-y-4">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Pending invites
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Waiting for claim
                </h2>
              </header>

              {dashboard.pendingInvites.length === 0 ? (
                <p className="text-base leading-7 text-muted">
                  No pending invites are waiting on this account.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboard.pendingInvites.map((invite) => (
                    <div
                      className="rounded-3xl border border-line bg-surface p-4"
                      key={invite.id}
                    >
                      <p className="text-base font-semibold text-ink">
                        {invite.className}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Class code {invite.classCode}. Status {invite.status}. Sent
                        {' '}
                        {formatUtcDate(invite.sentAtUtc)} and expires
                        {' '}
                        {formatUtcDate(invite.expiresAtUtc)}.
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <Button
                  leftIcon={<RefreshCcw className="size-4" />}
                  onClick={() => {
                    void loadDashboard().then(() => {
                      setClaimNotice(null)
                    })
                  }}
                  type="button"
                  variant="secondary"
                >
                  Refresh dashboard
                </Button>
              </div>
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  )
}
