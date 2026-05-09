import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  ArrowLeft,
  BookPlus,
  Check,
  Globe,
  Hash,
  Info,
  Lock,
  Shuffle,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
import { TextField } from '@/components/ui/text-field'
import { createTeacherClassRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage, getFieldErrors } from '@/lib/http/api-error'
import type { CreateTeacherClassRequest } from '@/types/classroom'

const subjectOptions = [
  'Toán',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lý',
  'Tin học',
  'Khác',
]

const termOptions = ['Học kỳ 1 2026-2027', 'Học kỳ 2 2026-2027', 'Hè 2026', 'Khác']

function generateClassCode(subject: string) {
  const prefix = subject.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) || 'CLAS'
  const suffix = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  return `${prefix}-${suffix}`
}

export function CreateTeacherClassPage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState<CreateTeacherClassRequest>({
    code: '',
    name: '',
  })
  const [setupPreview, setSetupPreview] = useState({
    grade: '10',
    importAfterCreate: false,
    joinMode: 'InviteOnly',
    subject: 'Math',
    term: termOptions[0],
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const createdClass = await createTeacherClassRequest({
        ...formState,
        grade: setupPreview.grade,
        joinMode: setupPreview.joinMode as 'InviteOnly' | 'CodeJoin',
        subject: setupPreview.subject,
        term: setupPreview.term,
      })
      navigate(
        setupPreview.importAfterCreate
          ? `/teacher/classes/${createdClass.id}/import`
          : `/classes/${createdClass.id}`,
        { replace: true },
      )
    } catch (error) {
      setFieldErrors(getFieldErrors(error))
      setSubmissionError(getErrorMessage(error, 'Không thể tạo lớp học này.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Có thể nhập mã thủ công hoặc để trống để hệ thống tự tạo mã dễ đọc."
        eyebrow="Tạo lớp"
        title="Chuẩn bị khung lớp học trước khi nhập học sinh"
      />

      {submissionError ? (
        <Notice tone="error" title="Không thể tạo lớp">
          {submissionError}
        </Notice>
      ) : null}

      <CardShell className="p-6 sm:p-8">
        <form className="grid gap-6 lg:grid-cols-[1fr_22rem]" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <TextField
              error={fieldErrors.name}
              label="Tên lớp"
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
              placeholder="Ví dụ: Vật lý 10A"
              value={formState.name}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1 text-sm font-medium text-ink">
                Môn học
                <select
                  className="min-h-11 rounded-[var(--radius-input)] border border-line bg-surface px-3 text-base text-ink outline-none transition focus:border-brand"
                  onChange={(event) => {
                    const subject = event.target.value
                    setSetupPreview((current) => ({ ...current, subject }))
                    setFormState((current) => ({
                      ...current,
                      code: current.code || generateClassCode(subject),
                    }))
                  }}
                  value={setupPreview.subject}
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-ink">
                Khối
                <select
                  className="min-h-11 rounded-[var(--radius-input)] border border-line bg-surface px-3 text-base text-ink outline-none transition focus:border-brand"
                  onChange={(event) => {
                    setSetupPreview((current) => ({
                      ...current,
                      grade: event.target.value,
                    }))
                  }}
                  value={setupPreview.grade}
                >
                  {['6', '7', '8', '9', '10', '11', '12', 'Khác'].map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-ink">
                Kỳ học
                <select
                  className="min-h-11 rounded-[var(--radius-input)] border border-line bg-surface px-3 text-base text-ink outline-none transition focus:border-brand"
                  onChange={(event) => {
                    setSetupPreview((current) => ({
                      ...current,
                      term: event.target.value,
                    }))
                  }}
                  value={setupPreview.term}
                >
                  {termOptions.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex gap-3">
              <TextField
                error={fieldErrors.code}
                hint="Tùy chọn. Để trống để máy chủ tự tạo mã."
                label="Mã tham gia"
                leftIcon={<Hash className="size-4" />}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    code: event.target.value.toUpperCase(),
                  }))
                  setFieldErrors((currentErrors) => ({
                    ...currentErrors,
                    code: '',
                  }))
                }}
                placeholder="VL10A"
                value={formState.code ?? ''}
              />
              <Button
                className="mt-6 shrink-0"
                leftIcon={<Shuffle className="size-4" />}
                onClick={() => {
                  setFormState((current) => ({
                    ...current,
                    code: generateClassCode(setupPreview.subject),
                  }))
                }}
                type="button"
                variant="secondary"
              >
                Tạo mã
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className={`rounded-[var(--radius-panel)] border p-4 text-left transition ${
                  setupPreview.joinMode === 'InviteOnly'
                    ? 'border-brand bg-brand-soft/55'
                    : 'border-line bg-surface hover:border-brand/35'
                }`}
                onClick={() => {
                  setSetupPreview((current) => ({
                    ...current,
                    joinMode: 'InviteOnly',
                  }))
                }}
                type="button"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Lock className="size-4 text-brand-strong" />
                  Chỉ mời
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted">
                  Giáo viên gửi lời mời danh sách cá nhân sau khi tạo lớp.
                </span>
              </button>
              <button
                className={`rounded-[var(--radius-panel)] border p-4 text-left transition ${
                  setupPreview.joinMode === 'CodeJoin'
                    ? 'border-brand bg-brand-soft/55'
                    : 'border-line bg-surface hover:border-brand/35'
                }`}
                onClick={() => {
                  setSetupPreview((current) => ({
                    ...current,
                    joinMode: 'CodeJoin',
                  }))
                }}
                type="button"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Globe className="size-4 text-brand-strong" />
                  Mã tham gia
                </span>
                <span className="mt-2 block text-sm leading-6 text-muted">
                  Hệ thống tạo mã cố định. Học sinh nhập mã này để vào lớp.
                </span>
              </button>
            </div>

              <Notice
                actions={(
                <Badge dot tone="success" variant="soft">
                  Siêu dữ liệu đã lưu
                </Badge>
              )}
              tone="success"
              title="Siêu dữ liệu thiết lập lớp học"
            >
              Môn học, khối, kỳ học và chế độ tham gia được lưu cùng lớp.
            </Notice>

            <div className="flex flex-wrap gap-3">
              <Link to="/teacher/dashboard">
                <Button leftIcon={<ArrowLeft className="size-4" />} variant="secondary">
                  Quay lại bảng điều khiển
                </Button>
              </Link>
              <Button isLoading={isSubmitting} leftIcon={<Check className="size-4" />} type="submit">
                Tạo lớp
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-panel)] border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Xem trước lớp học</p>
                <Badge dot tone="success" variant="soft">Hoạt động</Badge>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                {formState.code || 'AUTO-CODE'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                {formState.name || 'Xem trước tên lớp'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {setupPreview.subject} · Khối {setupPreview.grade} · {setupPreview.term}
              </p>
              <div className="mt-4 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line bg-panel p-4">
                <p className="flex items-start gap-2 text-sm leading-6 text-muted">
                  <Info className="mt-0.5 size-4 shrink-0 text-brand-strong" />
                  Mặc định sẽ mở lớp đã tạo. Bật nhập học sinh khi bạn
                  muốn dán danh sách ngay sau khi tạo.
                </p>
              </div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line bg-panel p-4">
                <input
                  checked={setupPreview.importAfterCreate}
                  className="mt-1"
                  onChange={(event) => {
                    setSetupPreview((current) => ({
                      ...current,
                      importAfterCreate: event.target.checked,
                    }))
                  }}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    Thiết lập học sinh sau khi tạo
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted">
                    Chọn cách thêm học sinh (mã tham gia hoặc Excel) ngay sau khi tạo lớp.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </form>
      </CardShell>
    </div>
  )
}
