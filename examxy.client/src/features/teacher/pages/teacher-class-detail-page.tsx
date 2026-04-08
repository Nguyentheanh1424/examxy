import { useEffect, useState } from 'react'
import { ArrowLeft, Mail, Upload } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { getTeacherClassRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type { TeacherClassDetail } from '@/types/classroom'

function formatUtcDate(value: string | null) {
  if (!value) {
    return 'Not yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function TeacherClassDetailPage() {
  const { classId = '' } = useParams()
  const [classroom, setClassroom] = useState<TeacherClassDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const response = await getTeacherClassRequest(classId)
        if (isMounted) {
          setClassroom(response)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(getErrorMessage(nextError, 'Unable to load this class.'))
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
  }, [classId])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading class details...
        </div>
      </div>
    )
  }

  if (error || !classroom) {
    return (
      <Notice tone="error" title="Unable to load class">
        {error ?? 'Class not found.'}
      </Notice>
    )
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              {classroom.code}
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                {classroom.name}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Status: {classroom.status}. Use this page to review roster members,
                pending invites, and recent import batches.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/teacher/dashboard">
              <Button leftIcon={<ArrowLeft className="size-4" />} variant="secondary">
                Dashboard
              </Button>
            </Link>
            <Link to={`/teacher/classes/${classroom.id}/import`}>
              <Button leftIcon={<Upload className="size-4" />}>Import roster</Button>
            </Link>
          </div>
        </div>
      </CardShell>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-4">
            <header className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Students
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Current roster
              </h2>
            </header>

            {classroom.memberships.length === 0 ? (
              <p className="text-base leading-7 text-muted">
                No students have joined this class yet.
              </p>
            ) : (
              <div className="space-y-3">
                {classroom.memberships.map((membership) => (
                  <div
                    className="rounded-3xl border border-line bg-surface p-4"
                    key={membership.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-ink">
                          {membership.studentFullName || membership.studentUserName}
                        </p>
                        <p className="text-sm leading-6 text-muted">
                          {membership.email}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-brand-strong">
                        {membership.status}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Student code: {membership.studentCode || 'Not set'}.
                      Joined: {formatUtcDate(membership.joinedAtUtc)}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardShell>

        <div className="space-y-6">
          <CardShell className="p-6 sm:p-8">
            <div className="space-y-4">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Invites
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Pending and used codes
                </h2>
              </header>

              {classroom.invites.length === 0 ? (
                <p className="text-base leading-7 text-muted">
                  No invites have been sent yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {classroom.invites.map((invite) => (
                    <div
                      className="rounded-3xl border border-line bg-surface p-4"
                      key={invite.id}
                    >
                      <p className="flex items-center gap-2 text-base font-semibold text-ink">
                        <Mail className="size-4 text-brand-strong" />
                        {invite.email}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Status: {invite.status}. Sent {formatUtcDate(invite.sentAtUtc)}.
                        Expires {formatUtcDate(invite.expiresAtUtc)}.
                      </p>
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
                  Imports
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Recent import batches
                </h2>
              </header>

              {classroom.importBatches.length === 0 ? (
                <p className="text-base leading-7 text-muted">
                  No roster import has run for this class yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {classroom.importBatches.map((batch) => (
                    <div
                      className="rounded-3xl border border-line bg-surface p-4"
                      key={batch.id}
                    >
                      <p className="text-base font-semibold text-ink">
                        {batch.sourceFileName || 'Manual import'}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Created {formatUtcDate(batch.createdAtUtc)}. Rows: {batch.totalRows},
                        created: {batch.createdAccountCount}, invited: {batch.sentInviteCount},
                        skipped: {batch.skippedCount}, rejected: {batch.rejectedCount}.
                      </p>

                      <div className="mt-4 space-y-2">
                        {batch.items.map((item) => (
                          <div
                            className="rounded-2xl border border-line/80 bg-panel px-3 py-2"
                            key={item.id}
                          >
                            <p className="text-sm font-medium text-ink">
                              Row {item.rowNumber}: {item.email}
                            </p>
                            <p className="text-sm leading-6 text-muted">
                              {item.resultType}: {item.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  )
}
