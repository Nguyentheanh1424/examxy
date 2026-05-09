import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  FileText,
  KeyRound,
  MoreHorizontal,
  RefreshCcw,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { PageHeader } from '@/components/ui/page-header'
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
    return 'Chưa có'
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
          setError(getErrorMessage(nextError, 'Không thể tải bảng điều khiển học sinh.'))
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
        title: 'Đã tham gia lớp',
        message: `Bạn đã tham gia ${response.className} (${response.classCode}).`,
      })
      setInviteCode('')
      setSearchParams({})
    } catch (nextError) {
      setClaimNotice({
        tone: 'error',
        title: 'Sử dụng mã mời thất bại',
        message: getErrorMessage(nextError, 'Không thể sử dụng mã mời này.'),
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
        title: 'Cần mã mời',
        message: 'Vui lòng nhập mã mời hợp lệ trước khi thử lại.',
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
          Đang tải bảng điều khiển...
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <Notice tone="error" title="Không thể tải bảng điều khiển">
        {error ?? 'Bảng điều khiển học sinh hiện không khả dụng.'}
      </Notice>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="rounded-[var(--radius-panel)] border border-brand/12 bg-brand-soft/55 p-4">
            <p className="text-sm font-semibold text-brand-strong">
              Không gian học tập
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Mã tham gia nằm ở đây; các thao tác tài khoản và thông báo nằm
              trên thanh tiêu đề chung.
            </p>
          </div>
        }
        description="Theo dõi các lớp đã tham gia, lời mời đang chờ và nhập mã lớp khi giáo viên gửi cho bạn."
        eyebrow="Bảng điều khiển học sinh"
        title={`Xin chào, ${dashboard.fullName || dashboard.userName}`}
      />

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
                Tham gia lớp
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Sử dụng mã mời
              </h2>
              <p className="text-base leading-7 text-muted">
                Mã mời được gắn với địa chỉ email đã được mời và chỉ có thể sử dụng
                một lần.
              </p>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField
                label="Mã mời"
                leftIcon={<KeyRound className="size-4" />}
                onChange={(event) => {
                  setInviteCode(event.target.value)
                }}
                placeholder="Nhập mã mời"
                value={inviteCode}
              />

              <Button fullWidth isLoading={isClaiming} type="submit">
                Tham gia lớp
              </Button>
            </form>

            <div className="rounded-3xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Hồ sơ tóm tắt</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Email: {dashboard.email}
                <br />
                Mã học sinh: {dashboard.studentCode || 'Chưa thiết lập'}
                <br />
                Trạng thái: {dashboard.onboardingState}
              </p>
            </div>
          </div>
        </CardShell>

        <div className="space-y-6">
          <CardShell className="p-6 sm:p-8">
            <div className="space-y-4">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Lớp đang hoạt động
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Các lớp đã tham gia
                </h2>
              </header>

              {dashboard.classes.length === 0 ? (
                <EmptyState
                  description="Nhập mã mời từ giáo viên để điền vào phần này."
                  title="Chưa tham gia lớp học nào"
                  variant="no-data"
                />
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
                        Mã: {item.code}. Trạng thái lớp: {item.status}. Thành viên:
                        {' '}
                        {item.membershipStatus}. Tham gia {formatUtcDate(item.joinedAtUtc)}.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Link to={`/classes/${item.id}`}>
                          <Button leftIcon={<BookOpen className="size-4" />} size="md">
                            Mở lớp
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Thêm thao tác cho ${item.name}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-brand-soft/60"
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <Link to={`/classes/${item.id}/assessments`}>
                              <DropdownMenuItem>
                                <FileText className="size-4 text-brand-strong" />
                                Bài kiểm tra
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                  Lời mời đang chờ
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Chờ sử dụng
                </h2>
              </header>

              {dashboard.pendingInvites.length === 0 ? (
                <p className="text-base leading-7 text-muted">
                  Không có lời mời nào đang chờ trên tài khoản này.
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
                        Mã lớp: {invite.classCode}. Trạng thái: {invite.status}. Gửi lúc
                        {' '}
                        {formatUtcDate(invite.sentAtUtc)} và hết hạn
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
                  Làm mới bảng điều khiển
                </Button>
              </div>
            </div>
          </CardShell>
        </div>
      </div>
    </div>
  )
}
