import type { FormEvent } from 'react'
import { useState } from 'react'
import { ArrowRight, AtSign, IdCard, KeyRound, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Notice } from '@/components/ui/notice'
import { TextField } from '@/components/ui/text-field'
import { useAuth } from '@/features/auth/auth-context'
import { AuthEdgeLayout } from '@/features/auth/components/auth-edge-layout'
import { getDefaultRouteForRole } from '@/features/auth/lib/auth-role-routing'
import {
  hasFieldErrors,
  validateStudentRegister,
} from '@/features/auth/lib/validation'
import { getErrorMessage, getFieldErrors } from '@/lib/http/api-error'
import type { StudentRegisterRequest } from '@/types/auth'

export function StudentRegisterPage() {
  const { registerStudent } = useAuth()
  const navigate = useNavigate()
  const [formState, setFormState] = useState<StudentRegisterRequest>({
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
    studentCode: '',
    userName: '',
  })
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof StudentRegisterRequest, string>>
  >({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<K extends keyof StudentRegisterRequest>(
    field: K,
    value: StudentRegisterRequest[K],
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }))

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }))

    setSubmissionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextFieldErrors = validateStudentRegister(formState)
    if (hasFieldErrors(nextFieldErrors)) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const nextSession = await registerStudent(formState)
      navigate(getDefaultRouteForRole(nextSession.primaryRole), { replace: true })
    } catch (error) {
      setFieldErrors(
        getFieldErrors(error) as Partial<Record<keyof StudentRegisterRequest, string>>,
      )
      setSubmissionError(getErrorMessage(error, 'Không thể tạo tài khoản học sinh.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthEdgeLayout>
      <div className="flex flex-col gap-6">
        <header className="space-y-3 pb-2 text-center lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            Đăng ký học sinh
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Tạo tài khoản học sinh
            </h1>
            <p className="text-base leading-relaxed text-muted">
              Tạo tài khoản riêng trước. Bạn có thể nhập mã mời lớp
              ngay sau khi đăng nhập.
            </p>
          </div>
        </header>

        {submissionError ? (
          <Notice tone="error" title="Không thể tạo tài khoản học sinh">
            {submissionError}
          </Notice>
        ) : null}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <TextField
            error={fieldErrors.fullName}
            label="Họ và tên"
            leftIcon={<UserRound className="size-4" />}
            onChange={(event) => {
              updateField('fullName', event.target.value)
            }}
            placeholder="Nguyễn Văn A"
            value={formState.fullName}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              error={fieldErrors.userName}
              label="Tên đăng nhập"
              leftIcon={<UserRound className="size-4" />}
              onChange={(event) => {
                updateField('userName', event.target.value)
              }}
              placeholder="alex.student"
              value={formState.userName}
            />

            <TextField
              error={fieldErrors.studentCode}
              label="Mã học sinh"
              leftIcon={<IdCard className="size-4" />}
              onChange={(event) => {
                updateField('studentCode', event.target.value)
              }}
              placeholder="HS-001"
              value={formState.studentCode}
            />
          </div>

          <TextField
            error={fieldErrors.email}
            label="Email"
            leftIcon={<AtSign className="size-4" />}
            onChange={(event) => {
              updateField('email', event.target.value)
            }}
            placeholder="student@example.com"
            type="email"
            value={formState.email}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              error={fieldErrors.password}
              label="Mật khẩu"
              leftIcon={<KeyRound className="size-4" />}
              onChange={(event) => {
                updateField('password', event.target.value)
              }}
              placeholder="Tạo mật khẩu"
              type="password"
              value={formState.password}
            />

            <TextField
              error={fieldErrors.confirmPassword}
              label="Xác nhận mật khẩu"
              leftIcon={<KeyRound className="size-4" />}
              onChange={(event) => {
                updateField('confirmPassword', event.target.value)
              }}
              placeholder="Nhập lại mật khẩu"
              type="password"
              value={formState.confirmPassword}
            />
          </div>

          <Button fullWidth isLoading={isSubmitting} size="lg" type="submit">
            Tạo tài khoản học sinh
          </Button>
        </form>

        <div className="border-t border-line/80 pt-4 text-center lg:text-left">
          <p className="text-base leading-relaxed text-muted">
            Đã có tài khoản?{' '}
            <Link
              className="inline-flex items-center gap-2 font-semibold text-brand-strong transition hover:opacity-80"
              to="/login"
            >
              Đăng nhập
              <ArrowRight className="size-4" />
            </Link>
          </p>
        </div>
      </div>
    </AuthEdgeLayout>
  )
}
