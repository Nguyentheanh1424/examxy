import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowLeft, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { importTeacherRosterRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type { StudentImportBatch, StudentRosterRowInput } from '@/types/classroom'

function parseRosterInput(rawValue: string) {
  const rows = rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return rows.map<StudentRosterRowInput>((line) => {
    const parts = line.split(/[,\t;]/).map((part) => part.trim())

    if (parts.length === 2) {
      return {
        fullName: parts[0],
        studentCode: '',
        email: parts[1],
      }
    }

    return {
      fullName: parts[0] ?? '',
      studentCode: parts[1] ?? '',
      email: parts[2] ?? '',
    }
  })
}

export function TeacherClassImportPage() {
  const { classId = '' } = useParams()
  const navigate = useNavigate()
  const [sourceFileName, setSourceFileName] = useState('manual-roster.csv')
  const [rawRoster, setRawRoster] = useState('')
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [result, setResult] = useState<StudentImportBatch | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmissionError(null)

    const students = parseRosterInput(rawRoster)
    if (students.length === 0) {
      setSubmissionError('Enter at least one roster row before importing.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await importTeacherRosterRequest(classId, {
        sourceFileName,
        students,
      })

      setResult(response)
    } catch (error) {
      setSubmissionError(getErrorMessage(error, 'Unable to import this roster.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Import students
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Paste a simple roster to create accounts and invites
          </h1>
          <p className="max-w-3xl text-base leading-7 text-muted">
            Use one line per student in the format
            {' '}
            <code>full name, student code, email</code>
            . If you do not have a student code, use
            {' '}
            <code>full name, email</code>
            .
          </p>
        </div>
      </CardShell>

      {submissionError ? (
        <Notice tone="error" title="Unable to import roster">
          {submissionError}
        </Notice>
      ) : null}

      {result ? (
        <Notice tone="success" title="Roster import completed">
          Processed {result.totalRows} rows with {result.createdAccountCount} new
          accounts, {result.sentInviteCount} invite-only rows, {result.skippedCount}
          skipped rows, and {result.rejectedCount} rejected rows.
        </Notice>
      ) : null}

      <CardShell className="p-6 sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            hint="This is only for batch audit visibility."
            label="Source file name"
            onChange={(event) => {
              setSourceFileName(event.target.value)
            }}
            value={sourceFileName}
          />

          <TextareaField
            label="Roster rows"
            onChange={(event) => {
              setRawRoster(event.target.value)
            }}
            placeholder={'Alex Nguyen, ST-001, alex@student.test\nLan Tran, lan@student.test'}
            rows={12}
            value={rawRoster}
          />

          <div className="flex flex-wrap gap-3">
            <Button
              leftIcon={<ArrowLeft className="size-4" />}
              onClick={() => {
                navigate(`/classes/${classId}`, { replace: true })
              }}
              type="button"
              variant="secondary"
            >
              Back to class
            </Button>
            <Button
              isLoading={isSubmitting}
              leftIcon={<Upload className="size-4" />}
              type="submit"
            >
              Run import
            </Button>
          </div>
        </form>
      </CardShell>

      {result ? (
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-4">
            <header className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Batch results
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Row-by-row outcome
              </h2>
            </header>

            <div className="space-y-3">
              {result.items.map((item) => (
                <div
                  className="rounded-3xl border border-line bg-surface p-4"
                  key={item.id}
                >
                  <p className="text-base font-semibold text-ink">
                    Row {item.rowNumber}: {item.email}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {item.resultType}. {item.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link to={`/classes/${classId}`}>
                <Button variant="secondary">Open class dashboard</Button>
              </Link>
            </div>
          </div>
        </CardShell>
      ) : null}
    </div>
  )
}
