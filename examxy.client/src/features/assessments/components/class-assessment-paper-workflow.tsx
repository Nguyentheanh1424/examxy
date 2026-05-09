import { Download, FileSearch } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { AssessmentSelectField as SelectField } from '@/features/assessments/components/assessment-select-field'
import type { ClassAssessmentsPageController } from '@/features/assessments/hooks/use-class-assessments-page'
import { createDefaultAnswerMap, formatUtcDate } from '@/features/assessments/lib/assessment-page-mappers'
import type { Assessment } from '@/types/assessment'

export function ClassAssessmentPaperWorkflow({ controller, assessment, isSelected }: { controller: ClassAssessmentsPageController; assessment: Assessment; isSelected: boolean }) {
  const { isTeacherOwner, paperBinding, bindingDraft, setBindingDraft, paperSubmissions, selectedSubmissionId, setSelectedSubmissionId, selectedSubmission, reviewDraft, setReviewDraft, isPaperLoading, isSubmissionLoading, busyKey, setActivateBindingDialogOpen, setFinalizeDialogOpen, publishedTemplateVersions, selectedPaperTemplateVersion, handleSaveBinding, handleReviewSubmission, handleDownloadArtifact } = controller

  return isTeacherOwner && isSelected ? (
                  <div className="space-y-4 rounded-[var(--radius-panel)] border border-brand/20 bg-brand-soft/20 p-5 shadow-[var(--shadow-panel)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                          Bài thi giấy
                        </p>
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                          Không gian duyệt của giáo viên
                        </h3>
                      </div>
                      <Link to="/teacher/paper-exams">
                        <Button variant="secondary">Mở không gian mẫu</Button>
                      </Link>
                    </div>

                    {isPaperLoading ? (
                      <div className="flex items-center gap-3 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface px-4 py-3 text-sm text-muted shadow-[var(--shadow-subtle)]">
                        <Spinner />
                        Đang tải liên kết bài giấy và bài nộp...
                      </div>
                    ) : null}

                    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-4 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-ink">1. Thiết lập liên kết</p>
                          <p className="text-sm leading-6 text-muted">
                            Chọn phiên bản mẫu bài giấy đã xuất bản, ánh xạ số câu hỏi,
                            và lưu nháp hoặc kích hoạt cho bài kiểm tra này.
                          </p>
                        </div>

                        <SelectField
                          hint={
                            publishedTemplateVersions.length === 0
                              ? 'Tạo và xuất bản phiên bản mẫu bài giấy trước.'
                              : undefined
                          }
                          label="Phiên bản mẫu đã xuất bản"
                          onChange={(event) => {
                            const nextVersionId = event.target.value
                            const nextVersion = publishedTemplateVersions.find(
                              (candidate) => candidate.version.id === nextVersionId,
                            )?.version

                            setBindingDraft((current) => ({
                              ...current,
                              templateVersionId: nextVersionId,
                              answerMap: createDefaultAnswerMap(
                                nextVersion?.questionCount ?? 0,
                                assessment,
                                current.answerMap,
                              ),
                            }))
                          }}
                          value={bindingDraft.templateVersionId}
                        >
                          <option value="">Chọn phiên bản đã xuất bản</option>
                          {publishedTemplateVersions.map((candidate) => (
                            <option key={candidate.version.id} value={candidate.version.id}>
                              {candidate.templateCode} - v{candidate.version.versionNumber} (
                              {candidate.templateName})
                            </option>
                          ))}
                        </SelectField>

                        {paperBinding ? (
                          <div className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel p-4 text-sm leading-6 text-muted shadow-[var(--shadow-subtle)]">
                            Trạng thái liên kết hiện tại: <strong>{paperBinding.status}</strong>
                            <br />
                            Mã cấu hình: {paperBinding.configHash}
                          </div>
                        ) : null}

                        {selectedPaperTemplateVersion ? (
                          <div className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel p-4 text-sm leading-6 text-muted shadow-[var(--shadow-subtle)]">
                            Mẫu {selectedPaperTemplateVersion.templateCode} phiên bản{' '}
                            {selectedPaperTemplateVersion.version.versionNumber}
                            <br />
                            Câu hỏi {selectedPaperTemplateVersion.version.questionCount} -
                            Lựa chọn {selectedPaperTemplateVersion.version.optionsPerQuestion}
                          </div>
                        ) : null}

                        <Accordion
                          defaultValue={['answer-map']}
                          type="multiple"
                        >
                          <AccordionItem className="bg-panel" value="answer-map">
                            <AccordionTrigger>Bản đồ đáp án</AccordionTrigger>
                            <AccordionContent className="space-y-3">
                              {bindingDraft.answerMap.length === 0 ? (
                                <p className="text-sm leading-6 text-muted">
                                  Chọn phiên bản mẫu đã xuất bản để tạo
                                  ánh xạ số câu hỏi.
                                </p>
                              ) : (
                                bindingDraft.answerMap.map((row, rowIndex) => (
                                  <div
                                    className="grid gap-3 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)] lg:grid-cols-[140px_1fr]"
                                    key={`answer-map-${row.questionNumber}`}
                                  >
                                    <TextField
                                      disabled
                                      label="Số câu hỏi"
                                      value={row.questionNumber}
                                    />
                                    <SelectField
                                      label="Câu hỏi kiểm tra"
                                      onChange={(event) => {
                                        setBindingDraft((current) => ({
                                          ...current,
                                          answerMap: current.answerMap.map(
                                            (candidate, candidateIndex) =>
                                              candidateIndex === rowIndex
                                                ? {
                                                    ...candidate,
                                                    assessmentItemId: event.target.value,
                                                  }
                                                : candidate,
                                          ),
                                        }))
                                      }}
                                      value={row.assessmentItemId}
                                    >
                                      <option value="">Chọn câu</option>
                                      {assessment.items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          #{item.displayOrder} - {item.snapshotStemPlainText}
                                        </option>
                                      ))}
                                    </SelectField>
                                  </div>
                                ))
                              )}
                            </AccordionContent>
                          </AccordionItem>

                          <AccordionItem className="bg-panel" value="policy-json">
                            <AccordionTrigger>Chính sách JSON nâng cao</AccordionTrigger>
                            <AccordionContent className="space-y-4">
                              <TextareaField
                                label="Chính sách siêu dữ liệu JSON"
                                onChange={(event) =>
                                  setBindingDraft((current) => ({
                                    ...current,
                                    metadataPolicyJson: event.target.value,
                                  }))
                                }
                                rows={4}
                                value={bindingDraft.metadataPolicyJson}
                              />
                              <TextareaField
                                label="Chính sách nộp bài JSON"
                                onChange={(event) =>
                                  setBindingDraft((current) => ({
                                    ...current,
                                    submissionPolicyJson: event.target.value,
                                  }))
                                }
                                rows={4}
                                value={bindingDraft.submissionPolicyJson}
                              />
                              <TextareaField
                                label="Chính sách duyệt JSON"
                                onChange={(event) =>
                                  setBindingDraft((current) => ({
                                    ...current,
                                    reviewPolicyJson: event.target.value,
                                  }))
                                }
                                rows={4}
                                value={bindingDraft.reviewPolicyJson}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            isLoading={busyKey === 'save-paper-binding'}
                            onClick={() => {
                              void handleSaveBinding(false)
                            }}
                            variant="secondary"
                          >
                            Lưu nháp liên kết bài giấy
                          </Button>
                          <Button
                            isLoading={busyKey === 'activate-paper-binding'}
                            onClick={() => {
                              setActivateBindingDialogOpen(true)
                            }}
                          >
                            Kích hoạt liên kết bài giấy
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-ink">2. Hàng đợi bài nộp</p>
                          <p className="text-sm leading-6 text-muted">
                            Xem lại các bài nộp đã nhận diện và mở một mục để ghi đè
                            thủ công hoặc hoàn tất.
                          </p>
                        </div>

                        {paperSubmissions.length === 0 ? (
                          <p className="text-sm leading-6 text-muted">
                            Chưa có bài nộp giấy ngoại tuyến nào được tải lên cho
                            bài kiểm tra này.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {paperSubmissions.map((submission) => (
                              <button
                                className={`w-full rounded-[calc(var(--radius-panel)-0.75rem)] border px-4 py-4 text-left shadow-[var(--shadow-subtle)] transition ${
                                  selectedSubmissionId === submission.id
                                    ? 'border-brand bg-brand-soft/70'
                                    : 'border-line/80 bg-panel hover:border-brand/30 hover:bg-surface'
                                }`}
                                key={submission.id}
                                onClick={() => {
                                  setSelectedSubmissionId(submission.id)
                                }}
                                type="button"
                              >
                                <div className="space-y-2">
                                  <p className="text-base font-semibold text-ink">
                                    {submission.status}
                                  </p>
                                  <p className="text-sm leading-6 text-muted">
                                    Điểm {submission.result?.score ?? 'Đang chờ'} - Học sinh{' '}
                                    {submission.result?.detectedStudentId ?? submission.studentUserId}
                                    <br />
                                    Bài {submission.result?.detectedQuizId ?? 'N/A'} - Cập nhật{' '}
                                    {formatUtcDate(submission.updatedAtUtc)}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                          <p className="text-sm font-semibold text-ink">Tổng quan hàng đợi</p>
                          <p className="text-sm leading-6 text-muted">
                            {paperSubmissions.length} bài nộp đã tải cho bài kiểm tra
                            này.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-ink">3. Duyệt bài nộp</p>
                        <p className="text-sm leading-6 text-muted">
                          Kiểm tra đáp án, tải tệp, lưu duyệt của giáo viên, hoặc
                          hoàn tất bài nộp.
                        </p>
                      </div>

                      {!selectedSubmissionId ? (
                        <div className="flex items-center gap-3 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel px-4 py-4 text-sm text-muted shadow-[var(--shadow-subtle)]">
                          <FileSearch className="size-4 text-brand-strong" />
                          Chọn một bài nộp từ hàng đợi để tải chi tiết duyệt.
                        </div>
                      ) : isSubmissionLoading ? (
                        <div className="flex items-center gap-3 rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel px-4 py-4 text-sm text-muted shadow-[var(--shadow-subtle)]">
                          <Spinner />
                          Đang tải chi tiết bài nộp...
                        </div>
                      ) : selectedSubmission ? (
                        <div className="space-y-4">
                          <div className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                            <p className="text-base font-semibold text-ink">
                              Bài nộp {selectedSubmission.status}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-muted">
                              Học sinh {selectedSubmission.result?.detectedStudentId ?? selectedSubmission.studentUserId}
                              <br />
                              Điểm {selectedSubmission.result?.score ?? 'Đang chờ'} - Hoàn tất{' '}
                              {formatUtcDate(selectedSubmission.finalizedAtUtc)}
                              <br />
                              Đã duyệt {formatUtcDate(selectedSubmission.reviewedAtUtc)}
                            </p>
                          </div>

                          <Accordion
                            defaultValue={['review-note', 'override-answers', 'artifacts']}
                            type="multiple"
                          >
                            <AccordionItem className="bg-panel" value="review-note">
                              <AccordionTrigger>Ghi chú giáo viên</AccordionTrigger>
                              <AccordionContent>
                                <TextareaField
                                  label="Ghi chú giáo viên"
                                  onChange={(event) =>
                                    setReviewDraft((current) => ({
                                      ...current,
                                      teacherNote: event.target.value,
                                    }))
                                  }
                                  rows={3}
                                  value={reviewDraft.teacherNote}
                                />
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem className="bg-panel" value="override-answers">
                              <AccordionTrigger>Ghi đè đáp án</AccordionTrigger>
                              <AccordionContent className="space-y-3">
                                {reviewDraft.overrideAnswers.map((answer, answerIndex) => (
                                  <div
                                    className="rounded-[calc(var(--radius-panel)-0.75rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]"
                                    key={`${answer.questionNumber}-${answer.assessmentItemId}`}
                                  >
                                    <div className="grid gap-4 lg:grid-cols-3">
                                      <TextField
                                        disabled
                                        label="Số câu hỏi"
                                        value={String(answer.questionNumber)}
                                      />
                                      <TextField
                                        disabled
                                        label="Câu hỏi kiểm tra"
                                        value={answer.assessmentItemId}
                                      />
                                      <TextField
                                        label="Lựa chọn phát hiện"
                                        onChange={(event) =>
                                          setReviewDraft((current) => ({
                                            ...current,
                                            overrideAnswers: current.overrideAnswers.map(
                                              (candidate, candidateIndex) =>
                                                candidateIndex === answerIndex
                                                  ? {
                                                      ...candidate,
                                                      detectedOption: event.target.value,
                                                    }
                                                  : candidate,
                                            ),
                                          }))
                                        }
                                        value={answer.detectedOption}
                                      />
                                    </div>
                                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                      <TextareaField
                                        label="Đáp án phát hiện JSON"
                                        onChange={(event) =>
                                          setReviewDraft((current) => ({
                                            ...current,
                                            overrideAnswers: current.overrideAnswers.map(
                                              (candidate, candidateIndex) =>
                                                candidateIndex === answerIndex
                                                  ? {
                                                      ...candidate,
                                                      detectedAnswerJson: event.target.value,
                                                    }
                                                  : candidate,
                                            ),
                                          }))
                                        }
                                        rows={4}
                                        value={answer.detectedAnswerJson}
                                      />
                                      <TextareaField
                                        label="Độ tin cậy JSON"
                                        onChange={(event) =>
                                          setReviewDraft((current) => ({
                                            ...current,
                                            overrideAnswers: current.overrideAnswers.map(
                                              (candidate, candidateIndex) =>
                                                candidateIndex === answerIndex
                                                  ? {
                                                      ...candidate,
                                                      confidenceJson: event.target.value,
                                                    }
                                                  : candidate,
                                            ),
                                          }))
                                        }
                                        rows={4}
                                        value={answer.confidenceJson}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem className="bg-panel" value="artifacts">
                              <AccordionTrigger>Tệp đính kèm</AccordionTrigger>
                              <AccordionContent>
                                {selectedSubmission.artifacts.length === 0 ? (
                                  <p className="text-sm leading-6 text-muted">
                                    Không có tệp duyệt nào được tạo cho bài nộp này.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-3">
                                    {selectedSubmission.artifacts.map((artifact) => (
                                      <Button
                                        isLoading={busyKey === `download-artifact-${artifact.id}`}
                                        key={artifact.id}
                                        leftIcon={<Download className="size-4" />}
                                        onClick={() => {
                                          void handleDownloadArtifact(artifact.id)
                                        }}
                                        variant="secondary"
                                      >
                                        Tải {artifact.artifactType}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              isLoading={busyKey === 'review-paper-submission'}
                              onClick={() => {
                                void handleReviewSubmission(false)
                              }}
                              variant="secondary"
                            >
                              Duyệt bài nộp
                            </Button>
                            <Button
                              isLoading={busyKey === 'finalize-paper-submission'}
                              onClick={() => {
                                setFinalizeDialogOpen(true)
                              }}
                            >
                              Hoàn tất bài nộp
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-6 text-muted">
                          Chi tiết bài nộp hiện không khả dụng.
                        </p>
                      )}
                    </div>
                  </div>
                ) : null
}
