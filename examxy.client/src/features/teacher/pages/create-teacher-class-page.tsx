import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowLeft, BookPlus, Hash } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { TextField } from '@/components/ui/text-field'
import { createTeacherClassRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage, getFieldErrors } from '@/lib/http/api-error'
import type { CreateTeacherClassRequest } from '@/types/classroom'

export function CreateTeacherClassPage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState<CreateTeacherClassRequest>({
    code: '',
    name: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const createdClass = await createTeacherClassRequest(formState)
      navigate(`/teacher/classes/${createdClass.id}`, { replace: true })
    } catch (error) {
      setFieldErrors(getFieldErrors(error))
      setSubmissionError(getErrorMessage(error, 'Unable to create this class.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Create class
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Prepare a class shell before importing students
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            The code can be entered manually or left blank so the API can generate
            a human-friendly one for you.
          </p>
        </div>
      </CardShell>

      {submissionError ? (
        <Notice tone="error" title="Unable to create class">
          {submissionError}
        </Notice>
      ) : null}

      <CardShell className="p-6 sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            error={fieldErrors.name}
            label="Class name"
            leftIcon={<BookPlus className="size-4" />}
            onChange={(event) => {
              setFormState((currentState) => ({
                ...currentState,
                name: event.target.value,
              }))
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                name: '',
              }))
            }}
            placeholder="Example: Physics 10A"
            value={formState.name}
          />

          <TextField
            error={fieldErrors.code}
            hint="Optional. Leave blank to let the server generate a code."
            label="Class code"
            leftIcon={<Hash className="size-4" />}
            onChange={(event) => {
              setFormState((currentState) => ({
                ...currentState,
                code: event.target.value,
              }))
              setFieldErrors((currentErrors) => ({
                ...currentErrors,
                code: '',
              }))
            }}
            placeholder="PHY10A"
            value={formState.code ?? ''}
          />

          <div className="flex flex-wrap gap-3">
            <Link to="/teacher/dashboard">
              <Button leftIcon={<ArrowLeft className="size-4" />} variant="secondary">
                Back to dashboard
              </Button>
            </Link>
            <Button isLoading={isSubmitting} type="submit">
              Create class
            </Button>
          </div>
        </form>
      </CardShell>
    </div>
  )
}
