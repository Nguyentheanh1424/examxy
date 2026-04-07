import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  MailWarning,
  RefreshCcw,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/auth-context'
import { AuthEdgeLayout } from '@/features/auth/components/auth-edge-layout'
import { confirmEmailRequest } from '@/features/auth/lib/auth-api'
import { getErrorMessage } from '@/lib/http/api-error'

type ConfirmationState = 'error' | 'invalid' | 'pending' | 'success'

const primaryLinkClasses =
  'focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl border border-transparent bg-brand px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-strong shadow-[0_22px_44px_-24px_rgba(42,94,204,0.75)]'

const secondaryLinkClasses =
  'focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10'

export function ConfirmEmailPage() {
  const { session } = useAuth()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId') ?? ''
  const token = searchParams.get('token') ?? ''
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    userId && token ? 'pending' : 'invalid',
  )
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const continueHref = session ? '/account' : '/login'

  useEffect(() => {
    if (!userId || !token) {
      return
    }

    let isActive = true

    void (async () => {
      try {
        await confirmEmailRequest({ token, userId })

        if (isActive) {
          setConfirmationState('success')
        }
      } catch (error) {
        if (isActive) {
          setSubmissionError(
            getErrorMessage(
              error,
              'Liên kết xác nhận này không còn hiệu lực.',
            ),
          )
          setConfirmationState('error')
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [token, userId])

  return (
    <AuthEdgeLayout>
      <header className="flex flex-col gap-5 text-center lg:text-left pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
          Xác nhận Email
        </p>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
            Hoàn tất quyền truy cập
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Examxy sẽ kiểm tra liên kết ngay khi trang này tải xong để bạn có thể bắt đầu sử dụng tài khoản.
          </p>
        </div>
      </header>

      {confirmationState === 'pending' ? (
        <Notice tone="info" title="Đang xác nhận email">
          <span className="inline-flex items-center gap-2">
            <Spinner />
            Đang xác thực thông tin với hệ thống...
          </span>
        </Notice>
      ) : null}

      {confirmationState === 'success' ? (
        <Notice tone="success" title="Đã xác nhận email">
          Tài khoản của bạn đã sẵn sàng. Bạn có thể tiếp tục đến bảng điều khiển hoặc quay lại đăng nhập.
        </Notice>
      ) : null}

      {confirmationState === 'invalid' ? (
        <Notice tone="warning" title="Liên kết không hợp lệ">
          Trang này cần cả mã định danh người dùng và mã xác thực từ liên kết email. Vui lòng kiểm tra lại email của bạn.
        </Notice>
      ) : null}

      {confirmationState === 'error' ? (
        <Notice tone="error" title="Không thể xác nhận email này">
          {submissionError}
        </Notice>
      ) : null}

      {confirmationState === 'success' ? (
        <div className="flex flex-wrap gap-3">
          <Link className={primaryLinkClasses} to={continueHref}>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="size-4" />
              Tiếp tục
            </span>
          </Link>
        </div>
      ) : null}

      {(confirmationState === 'invalid' || confirmationState === 'error') ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link className={secondaryLinkClasses} to="/resend-email-confirmation">
            <span className="inline-flex items-center gap-2">
              <RefreshCcw className="size-4" />
              Yêu cầu email mới
            </span>
          </Link>

          <Link className={secondaryLinkClasses} to="/login">
            <span className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </span>
          </Link>
        </div>
      ) : null}

      {confirmationState === 'success' ? (
        <div className="inline-flex items-center justify-center lg:justify-start gap-2 rounded-full bg-success-soft/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-success">
          <CheckCircle2 className="size-3.5" />
          Xác nhận hoàn tất
        </div>
      ) : null}

      {(confirmationState === 'invalid' || confirmationState === 'error') ? (
        <div className="inline-flex items-center justify-center lg:justify-start gap-2 rounded-full bg-warning-soft/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          <MailWarning className="size-3.5" />
          Có thể khôi phục
        </div>
      ) : null}
    </AuthEdgeLayout>
  )
}
