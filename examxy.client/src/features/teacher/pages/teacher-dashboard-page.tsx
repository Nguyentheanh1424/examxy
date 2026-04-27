import { useEffect, useState } from 'react'
import { ArrowRight, BellRing, BookOpen, LibraryBig, PlusCircle, ScanSearch } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { getTeacherClassesRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type { TeacherClassSummary } from '@/types/classroom'

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function TeacherDashboardPage() {
  const [classes, setClasses] = useState<TeacherClassSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const response = await getTeacherClassesRequest()
        if (isMounted) {
          setClasses(response)
        }
      } catch (nextError) {
        if (isMounted) {
          setError(getErrorMessage(nextError, 'Unable to load your classes.'))
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

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Teacher dashboard
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                Manage classes and student onboarding
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Create classes, review roster activity, and open the import flow
                for new student lists.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/notifications">
              <Button leftIcon={<BellRing className="size-4" />} variant="secondary">
                Notifications
              </Button>
            </Link>
            <Link to="/teacher/question-bank">
              <Button leftIcon={<LibraryBig className="size-4" />} variant="secondary">
                Question bank
              </Button>
            </Link>
            <Link to="/teacher/paper-exams">
              <Button leftIcon={<ScanSearch className="size-4" />} variant="secondary">
                Paper exams
              </Button>
            </Link>
            <Link to="/account">
              <Button variant="secondary">Account settings</Button>
            </Link>
            <Link to="/teacher/classes/new">
              <Button leftIcon={<PlusCircle className="size-4" />}>
                Create class
              </Button>
            </Link>
          </div>
        </div>
      </CardShell>

      {error ? (
        <Notice tone="error" title="Unable to load classes">
          {error}
        </Notice>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
            <Spinner />
            Loading classes...
          </div>
        </div>
      ) : null}

      {!isLoading && classes.length === 0 ? (
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              No classes yet
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
              Start with your first class shell
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted">
              Create a class first, then import a student list to send invites
              and activation emails in one flow.
            </p>
          </div>
        </CardShell>
      ) : null}

      {classes.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {classes.map((item) => (
            <CardShell className="p-6" key={item.id}>
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                    {item.code}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                    {item.name}
                  </h2>
                  <p className="text-sm leading-6 text-muted">
                    Created {formatUtcDate(item.createdAtUtc)}. Status: {item.status}.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-line bg-surface p-4">
                    <p className="text-sm font-semibold text-ink">Active students</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">
                      {item.activeStudentCount}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-line bg-surface p-4">
                    <p className="text-sm font-semibold text-ink">Pending invites</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">
                      {item.pendingInviteCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link to={`/classes/${item.id}`}>
                    <Button
                      leftIcon={<BookOpen className="size-4" />}
                      variant="secondary"
                    >
                      Open class
                    </Button>
                  </Link>
                  <Link to={`/classes/${item.id}/assessments`}>
                    <Button variant="secondary">Assessments</Button>
                  </Link>
                  <Link to={`/teacher/classes/${item.id}/import`}>
                    <Button rightIcon={<ArrowRight className="size-4" />}>
                      Import students
                    </Button>
                  </Link>
                </div>
              </div>
            </CardShell>
          ))}
        </div>
      ) : null}
    </div>
  )
}
