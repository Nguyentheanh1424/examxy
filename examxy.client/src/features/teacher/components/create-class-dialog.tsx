import { useState } from 'react'
import {
  BookPlus,
  Check,
  ChevronRight,
  Globe,
  Hash,
  Shuffle,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Notice } from '@/components/ui/notice'
import { TextField } from '@/components/ui/text-field'
import { createTeacherClassRequest } from '@/features/classrooms/lib/class-api'
import { getErrorMessage, getFieldErrors } from '@/lib/http/api-error'
import { cn } from '@/lib/utils/cn'
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

type Step = 'INFO' | 'METHOD' | 'CONFIRM'

interface CreateClassDialogProps {
  onClose: () => void
  onSuccess: (classId: string, method: 'JoinCode' | 'Excel') => void
  open: boolean
}

export function CreateClassDialog({ onClose, onSuccess, open }: CreateClassDialogProps) {
  const [step, setStep] = useState<Step>('INFO')
  const [formState, setFormState] = useState<CreateTeacherClassRequest>({
    code: '',
    name: '',
  })
  const [setup, setSetup] = useState({
    grade: '10',
    subject: 'Toán',
    term: termOptions[0],
    method: 'JoinCode' as 'JoinCode' | 'Excel',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = () => {
    if (step === 'INFO') {
      if (!formState.name) {
        setFieldErrors({ name: 'Vui lòng nhập tên lớp.' })
        return
      }
      setStep('METHOD')
    } else if (step === 'METHOD') {
      setStep('CONFIRM')
    }
  }

  const handleBack = () => {
    if (step === 'METHOD') setStep('INFO')
    if (step === 'CONFIRM') setStep('METHOD')
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionError(null)

    try {
      const createdClass = await createTeacherClassRequest({
        ...formState,
        grade: setup.grade,
        joinMode: setup.method === 'JoinCode' ? 'CodeJoin' : 'InviteOnly',
        subject: setup.subject,
        term: setup.term,
      })
      onSuccess(createdClass.id, setup.method)
    } catch (error) {
      setFieldErrors(getFieldErrors(error))
      setSubmissionError(getErrorMessage(error, 'Không thể tạo lớp học này.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog onOpenChange={(val) => !val && onClose()} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("size-2 rounded-full", step === 'INFO' ? "bg-brand" : "bg-line")} />
            <div className={cn("size-2 rounded-full", step === 'METHOD' ? "bg-brand" : "bg-line")} />
            <div className={cn("size-2 rounded-full", step === 'CONFIRM' ? "bg-brand" : "bg-line")} />
            <span className="text-xs font-medium text-muted ml-auto">
              Bước {step === 'INFO' ? '1' : step === 'METHOD' ? '2' : '3'} / 3
            </span>
          </div>
          <DialogTitle>
            {step === 'INFO' ? 'Thông tin lớp học' : step === 'METHOD' ? 'Cách thêm học sinh' : 'Xác nhận tạo lớp'}
          </DialogTitle>
          <DialogDescription>
            {step === 'INFO' && 'Nhập các thông tin cơ bản để khởi tạo khung lớp học.'}
            {step === 'METHOD' && 'Chọn phương thức học sinh sẽ tham gia vào lớp của bạn.'}
            {step === 'CONFIRM' && 'Kiểm tra lại thông tin trước khi hệ thống khởi tạo lớp.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {submissionError && (
            <Notice tone="error" title="Lỗi hệ thống" className="mb-4">
              {submissionError}
            </Notice>
          )}

          {step === 'INFO' && (
            <div className="space-y-4">
              <TextField
                error={fieldErrors.name}
                label="Tên lớp"
                leftIcon={<BookPlus className="size-4" />}
                onChange={(e) => {
                  setFormState({ ...formState, name: e.target.value })
                  setFieldErrors({ ...fieldErrors, name: '' })
                }}
                placeholder="Ví dụ: Vật lý 10A"
                value={formState.name}
                autoFocus
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-ink">Môn học</label>
                  <select
                    className="min-h-11 rounded-[var(--radius-input)] border border-line bg-surface px-3 text-sm"
                    onChange={(e) => {
                      const subject = e.target.value
                      setSetup({ ...setup, subject })
                      setFormState({ ...formState, code: formState.code || generateClassCode(subject) })
                    }}
                    value={setup.subject}
                  >
                    {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-ink">Khối</label>
                  <select
                    className="min-h-11 rounded-[var(--radius-input)] border border-line bg-surface px-3 text-sm"
                    onChange={(e) => setSetup({ ...setup, grade: e.target.value })}
                    value={setup.grade}
                  >
                    {['6', '7', '8', '9', '10', '11', '12', 'Khác'].map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium text-ink">Kỳ học</label>
                  <select
                    className="min-h-11 rounded-[var(--radius-input)] border border-line bg-surface px-3 text-sm"
                    onChange={(e) => setSetup({ ...setup, term: e.target.value })}
                    value={setup.term}
                  >
                    {termOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 items-end">
                <TextField
                  className="flex-1"
                  label="Mã tham gia"
                  leftIcon={<Hash className="size-4" />}
                  onChange={(e) => setFormState({ ...formState, code: e.target.value.toUpperCase() })}
                  placeholder="AUTO-GENERATED"
                  value={formState.code}
                />
                <Button
                  onClick={() => setFormState({ ...formState, code: generateClassCode(setup.subject) })}
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="mb-0.5"
                >
                  <Shuffle className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'METHOD' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                className={cn(
                  "flex flex-col text-left p-4 rounded-2xl border transition group",
                  setup.method === 'JoinCode' ? "border-brand bg-brand-soft/30 ring-1 ring-brand" : "border-line bg-surface hover:border-brand/40"
                )}
                onClick={() => setSetup({ ...setup, method: 'JoinCode' })}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white border border-line mb-3 group-hover:scale-110 transition-transform">
                  <Globe className="size-5 text-brand-strong" />
                </div>
                <h4 className="font-bold text-ink">Dùng mã tham gia</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Hệ thống tạo mã cố định. Học sinh nhập mã này để vào lớp. Phù hợp gửi qua nhóm chat.
                </p>
                <div className="mt-auto pt-4 flex items-center text-xs font-bold text-brand-strong">
                  {setup.method === 'JoinCode' && <Check className="size-3.5 mr-1" />}
                  {setup.method === 'JoinCode' ? 'Đã chọn' : 'Chọn cách này'}
                </div>
              </button>

              <button
                className={cn(
                  "flex flex-col text-left p-4 rounded-2xl border transition group",
                  setup.method === 'Excel' ? "border-brand bg-brand-soft/30 ring-1 ring-brand" : "border-line bg-surface hover:border-brand/40"
                )}
                onClick={() => setSetup({ ...setup, method: 'Excel' })}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white border border-line mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="size-5 text-brand-strong" />
                </div>
                <h4 className="font-bold text-ink">Upload danh sách Excel</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Tạo tài khoản và gửi lời mời qua email hàng loạt. Phù hợp khi bạn đã có danh sách lớp.
                </p>
                <div className="mt-auto pt-4 flex items-center text-xs font-bold text-brand-strong">
                  {setup.method === 'Excel' && <Check className="size-3.5 mr-1" />}
                  {setup.method === 'Excel' ? 'Đã chọn' : 'Chọn cách này'}
                </div>
              </button>
            </div>
          )}

          {step === 'CONFIRM' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-line bg-surface-alt/20 p-5">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-sm font-bold uppercase tracking-wider text-muted">Tóm tắt lớp học</h4>
                   <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStep('INFO')}>Sửa</Button>
                </div>
                <div className="grid gap-y-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted">Tên lớp</p>
                    <p className="font-bold text-ink">{formState.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Mã tham gia</p>
                    <p className="font-mono font-bold text-brand-strong">{formState.code || '(Tự động tạo)'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Môn học & Khối</p>
                    <p className="font-medium text-ink">{setup.subject} · Khối {setup.grade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Kỳ học</p>
                    <p className="font-medium text-ink">{setup.term}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-surface-alt/20 p-5">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-sm font-bold uppercase tracking-wider text-muted">Phương thức mời</h4>
                   <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setStep('METHOD')}>Sửa</Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white border border-line">
                    {setup.method === 'JoinCode' ? <Globe className="size-5 text-brand" /> : <Upload className="size-5 text-brand" />}
                  </div>
                  <div>
                    <p className="font-bold text-ink">{setup.method === 'JoinCode' ? 'Sử dụng mã tham gia' : 'Upload danh sách Excel'}</p>
                    <p className="text-xs text-muted">
                      {setup.method === 'JoinCode' ? 'Mã tham gia sẽ luôn được tạo sẵn cho lớp này.' : 'Hệ thống sẽ chuyển bạn đến trang upload ngay sau khi tạo.'}
                    </p>
                  </div>
                </div>
              </div>

              <Notice tone="info">
                Mã tham gia luôn được tạo sẵn. Nếu bạn chưa muốn tải danh sách học sinh, lớp sẽ được tạo với mã tham gia này và bạn có thể thêm sau.
              </Notice>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row sm:justify-between items-center">
          {step !== 'INFO' ? (
            <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>Quay lại</Button>
          ) : <div />}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
            {step === 'CONFIRM' ? (
              <Button isLoading={isSubmitting} onClick={handleSubmit} leftIcon={<Check className="size-4" />}>
                Xác nhận tạo lớp
              </Button>
            ) : (
              <Button onClick={handleNext} rightIcon={<ChevronRight className="size-4" />}>
                {step === 'INFO' ? 'Tiếp tục thiết lập lớp' : 'Thiết lập học sinh'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
