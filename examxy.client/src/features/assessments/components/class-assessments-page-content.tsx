import { BookCheck, ClipboardCheck, Eye, MoreHorizontal, RefreshCcw, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { PageHeader } from '@/components/ui/page-header'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { ClassAssessmentPaperWorkflow } from '@/features/assessments/components/class-assessment-paper-workflow'
import type { ClassAssessmentsPageController } from '@/features/assessments/hooks/use-class-assessments-page'
import { formatUtcDate, type AssessmentStatusTab } from '@/features/assessments/lib/assessment-page-mappers'

export function ClassAssessmentsPageContent({ controller }: { controller: ClassAssessmentsPageController }) {
  const { classId, searchParams, setSearchParams, resultsByAssessmentId, attemptByAssessmentId, answerDraftByItemId, setAnswerDraftByItemId, className, isTeacherOwner, isLoading, busyKey, error, notice, draft, setDraft, createDrawerOpen, setCreateDrawerOpen, statusTab, setStatusTab, publishTarget, setPublishTarget, submitTargetId, setSubmitTargetId, activateBindingDialogOpen, setActivateBindingDialogOpen, finalizeDialogOpen, setFinalizeDialogOpen, selectedAssessment, filteredAssessments, refreshAssessments, refreshPaperTemplates, refreshPaperExamState, handleCreateAssessment, handlePublish, handleLoadResults, handleStartAttempt, handleSaveAnswers, handleSubmitAttempt, handleSaveBinding, handleReviewSubmission } = controller

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-line/70 pb-5">
          <div className="flex items-center gap-3 rounded-full border border-brand/20 bg-surface/85 px-5 py-3 text-sm font-medium text-muted shadow-[var(--shadow-subtle)]">
            <Spinner />
            Đang tải bài kiểm tra...
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-20 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/70 bg-surface/70 shadow-[var(--shadow-subtle)]" />
          <div className="h-20 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/70 bg-surface/70 shadow-[var(--shadow-subtle)]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Notice tone="error" title="Không thể tải bài kiểm tra">
        {error}
      </Notice>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <nav aria-label="Thao tác trang bài kiểm tra" className="flex flex-wrap gap-3">
            {isTeacherOwner ? (
              <Button
                leftIcon={<Rocket className="size-4" />}
                onClick={() => { setCreateDrawerOpen(true) }}
              >
                Tạo bài kiểm tra
              </Button>
            ) : null}
            <Link to={`/classes/${classId}`}>
              <Button variant="secondary">Quay lại lớp</Button>
            </Link>
          </nav>
        }
        description="Quản lý bài kiểm tra bản nháp và đã xuất bản, hoặc chạy quy trình làm bài của học sinh."
        eyebrow="Bài kiểm tra lớp"
        title={className || 'Không gian bài kiểm tra'}
      />

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {isTeacherOwner ? (
        <Drawer onOpenChange={setCreateDrawerOpen} open={createDrawerOpen}>
          {createDrawerOpen ? (
            <DrawerContent className="overflow-auto sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(92vw,42rem)] sm:rounded-l-[var(--radius-panel)] sm:rounded-r-none sm:border-l">
              <DrawerHeader>
                <DrawerTitle>Tạo bài kiểm tra nháp</DrawerTitle>
                <DrawerDescription>
                  Tạo bài kiểm tra nháp với API bài kiểm tra lớp hiện có.
                </DrawerDescription>
              </DrawerHeader>
              <form className="space-y-4" onSubmit={handleCreateAssessment}>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                Quy trình giáo viên
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Tạo bài kiểm tra nháp
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <TextField
                label="Tiêu đề"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                value={draft.title}
              />
              <TextField
                label="Loại bài kiểm tra"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assessmentKind: event.target.value,
                  }))
                }
                value={draft.assessmentKind}
              />
              <TextField
                label="Giới hạn lượt làm"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    attemptLimit: event.target.value,
                  }))
                }
                type="number"
                value={draft.attemptLimit}
              />
              <TextField
                label="Giới hạn thời gian (phút)"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    timeLimitMinutes: event.target.value,
                  }))
                }
                type="number"
                value={draft.timeLimitMinutes}
              />
              <TextField
                label="Chế độ hiển đáp án"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    showAnswersMode: event.target.value,
                  }))
                }
                value={draft.showAnswersMode}
              />
              <TextField
                label="Chế độ công bố điểm"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    scoreReleaseMode: event.target.value,
                  }))
                }
                value={draft.scoreReleaseMode}
              />
            </div>

            <TextareaField
              label="Mô tả"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              value={draft.description}
            />

            <TextareaField
              label="Câu hỏi JSON"
              onChange={(event) =>
                setDraft((current) => ({ ...current, itemsJson: event.target.value }))
              }
              rows={10}
              value={draft.itemsJson}
            />

                <DrawerFooter>
                  <Button
                    isLoading={busyKey === 'create-assessment'}
                    leftIcon={<Rocket className="size-4" />}
                    type="submit"
                  >
                    Tạo bài kiểm tra
                  </Button>
                  <Button
                    onClick={() => { setCreateDrawerOpen(false) }}
                    type="button"
                    variant="secondary"
                  >
                    Hủy
                  </Button>
                </DrawerFooter>
              </form>
            </DrawerContent>
          ) : null}
        </Drawer>
      ) : null}

      <CardShell
        aria-label="Danh sách bài kiểm tra"
        className="p-4 sm:p-5"
        role="region"
        variant="subtle"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Danh sách bài kiểm tra</p>
            <p className="text-sm text-muted">
              Lọc bài kiểm tra đã tải theo trạng thái thực tế.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => {
                void refreshAssessments()
                if (selectedAssessment && isTeacherOwner) {
                  void refreshPaperTemplates()
                  void refreshPaperExamState(selectedAssessment)
                }
              }}
              variant="secondary"
            >
              Làm mới
            </Button>
            <Tabs
              onValueChange={(value) => { setStatusTab(value as AssessmentStatusTab) }}
              value={statusTab}
            >
              <TabsList>
                {(['All', 'Draft', 'Published', 'Closed'] as const).map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardShell>

      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <CardShell className="p-6 sm:p-8" variant="subtle">
            <p className="text-base leading-7 text-muted">
              Không có bài kiểm tra phù hợp với chế độ xem này.
            </p>
          </CardShell>
        ) : null}

        {filteredAssessments.map((assessment) => {
          const activeAttempt = attemptByAssessmentId[assessment.id]
          const results = resultsByAssessmentId[assessment.id]
          const isSelected = selectedAssessment?.id === assessment.id

          return (
            <CardShell
              accentTone={
                isSelected
                  ? 'brand'
                  : assessment.status === 'Published'
                    ? 'success'
                    : assessment.status === 'Draft'
                      ? 'warning'
                      : 'none'
              }
              className="p-6"
              interactive={!isSelected}
              key={assessment.id}
              selected={isSelected}
              variant={isSelected ? 'elevated' : 'subtle'}
            >
              <div className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                        {assessment.status}
                      </span>
                      {isSelected ? (
                        <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                          Đang xem
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                      {assessment.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted">
                      {assessment.descriptionPlainText || 'Không có mô tả.'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                      <p className="text-sm font-semibold text-ink">Lịch trình</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Xuất bản {formatUtcDate(assessment.publishAtUtc)}
                        <br />
                        Đóng {formatUtcDate(assessment.closeAtUtc)}
                      </p>
                    </div>
                    <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                      <p className="text-sm font-semibold text-ink">Quy tắc</p>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Giới hạn lượt làm {assessment.attemptLimit}
                        <br />
                        Giới hạn thời gian {assessment.timeLimitMinutes ?? 'Không'}
                      </p>
                    </div>
                  </div>
                </div>

                {isSelected ? (
                  <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                    <p className="text-sm font-semibold text-ink">
                      Câu hỏi ({assessment.items.length})
                    </p>
                    <div className="mt-3 space-y-3">
                      {assessment.items.map((item) => (
                        <div
                          className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]"
                          key={item.id}
                        >
                          <p className="text-sm font-semibold text-ink">
                            #{item.displayOrder} - {item.snapshotQuestionType} - {item.points} pts
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {item.snapshotStemPlainText}
                          </p>
                          {!isTeacherOwner && activeAttempt && activeAttempt.status === 'InProgress' ? (
                            <TextareaField
                              label="Đáp án JSON"
                              onChange={(event) => {
                                setAnswerDraftByItemId((current) => ({
                                  ...current,
                                  [item.id]: event.target.value,
                                }))
                              }}
                              rows={3}
                              value={answerDraftByItemId[item.id] ?? ''}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      const nextParams = new URLSearchParams(searchParams)
                      nextParams.set('assessmentId', assessment.id)
                      setSearchParams(nextParams)
                    }}
                    variant={isSelected ? 'secondary' : 'ghost'}
                  >
                    {isSelected ? 'Đang xem bài kiểm tra' : 'Xem bài kiểm tra'}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={`Thêm thao tác cho ${assessment.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-brand-soft/60"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {isTeacherOwner ? (
                        <>
                      {assessment.status !== 'Published' ? (
                        <DropdownMenuItem
                          disabled={busyKey === `publish-${assessment.id}`}
                          onClick={() => {
                            setPublishTarget(assessment)
                          }}
                        >
                          <Rocket className="size-4 text-brand-strong" />
                           Xuất bản
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        disabled={busyKey === `results-${assessment.id}`}
                        onClick={() => {
                          void handleLoadResults(assessment.id)
                        }}
                      >
                        <Eye className="size-4 text-brand-strong" />
                         Xem kết quả
                      </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                      {!activeAttempt ? (
                        <DropdownMenuItem
                          disabled={busyKey === `attempt-${assessment.id}`}
                          onClick={() => {
                            void handleStartAttempt(assessment.id)
                          }}
                        >
                          <BookCheck className="size-4 text-brand-strong" />
                           Bắt đầu làm bài
                        </DropdownMenuItem>
                      ) : null}

                      {activeAttempt?.status === 'InProgress' ? (
                        <>
                          <DropdownMenuItem
                            disabled={busyKey === `save-${assessment.id}`}
                            onClick={() => {
                              void handleSaveAnswers(assessment)
                            }}
                          >
                            <BookCheck className="size-4 text-brand-strong" />
                             Lưu đáp án
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={busyKey === `submit-${assessment.id}`}
                            onClick={() => {
                              setSubmitTargetId(assessment.id)
                            }}
                          >
                            <ClipboardCheck className="size-4 text-brand-strong" />
                             Nộp bài
                          </DropdownMenuItem>
                        </>
                      ) : null}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {activeAttempt ? (
                  <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-brand/20 bg-brand-soft/25 p-4 shadow-[var(--shadow-subtle)]">
                     <p className="text-sm font-semibold text-ink">Lượt làm hiện tại</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                       Lượt #{activeAttempt.attemptNumber} - {activeAttempt.status}
                       <br />
                       Điểm {activeAttempt.earnedScore} / {activeAttempt.maxScore}
                    </p>
                  </div>
                ) : null}

                {results ? (
                  <div className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                    <p className="text-sm font-semibold text-ink">
                       Kết quả giáo viên ({results.length})
                    </p>
                    <div className="mt-3 space-y-3">
                      {results.map((result) => (
                        <div
                          className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]"
                          key={result.id}
                        >
                          <p className="text-sm font-semibold text-ink">
                             Lượt #{result.attemptNumber} - {result.status}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted">
                             Bắt đầu {formatUtcDate(result.startedAtUtc)}
                             <br />
                             Nộp {formatUtcDate(result.submittedAtUtc)}
                             <br />
                             Điểm {result.earnedScore} / {result.maxScore}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <ClassAssessmentPaperWorkflow controller={controller} assessment={assessment} isSelected={isSelected} />
              </div>
            </CardShell>
          )
        })}
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPublishTarget(null)
        }}
        open={publishTarget !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xuất bản bài kiểm tra này?</AlertDialogTitle>
            <AlertDialogDescription>
              Học sinh sẽ có thể truy cập bài kiểm tra này theo lịch trình.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPublishTarget(null) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!publishTarget || busyKey === `publish-${publishTarget.id}`}
              onClick={() => {
                if (publishTarget) {
                  void handlePublish(publishTarget)
                }
              }}
            >
              Xuất bản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setSubmitTargetId(null)
        }}
        open={submitTargetId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nộp bài làm này?</AlertDialogTitle>
            <AlertDialogDescription>
              Lượt làm hiện tại sẽ được nộp và chấm theo chính sách bài kiểm tra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setSubmitTargetId(null) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!submitTargetId || busyKey === `submit-${submitTargetId}`}
              onClick={() => {
                if (submitTargetId) {
                  void handleSubmitAttempt(submitTargetId)
                }
              }}
            >
              Nộp bài
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={setActivateBindingDialogOpen}
        open={activateBindingDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kích hoạt liên kết bài giấy?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài kiểm tra này sẽ sử dụng phiên bản mẫu bài giấy đã xuất bản được chọn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setActivateBindingDialogOpen(false) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busyKey === 'activate-paper-binding'}
              onClick={() => { void handleSaveBinding(true) }}
            >
              Kích hoạt liên kết
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setFinalizeDialogOpen} open={finalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hoàn tất bài nộp này?</AlertDialogTitle>
            <AlertDialogDescription>
              Bài nộp bài giấy đã hoàn tất sẽ không thể chỉnh sửa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setFinalizeDialogOpen(false) }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busyKey === 'finalize-paper-submission'}
              onClick={() => { void handleReviewSubmission(true) }}
            >
              Hoàn tất bài nộp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
