import { useRef, useState } from 'react'
import { CheckCircle2, Copy, FileDown, Layers3, Upload } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { CheckboxField } from '@/components/ui/checkbox-field'
import { Notice } from '@/components/ui/notice'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import {
  TemplatePreviewSummary,
  TemplateStatusBadge,
  ValidationSummary,
  VersionStatusCard,
} from '@/features/paper-exams/components/paper-exam-template-cards'
import type { PaperExamTemplatesPageController } from '@/features/paper-exams/hooks/use-paper-exam-templates-page'
import {
  emptyMetadataFieldDraft,
  getAssetByType,
  jsonAssetTypes,
} from '@/features/paper-exams/lib/paper-exam-template-mappers'
import {
  exportTemplateSvgToPdf,
  templateSettingsFromVersionValues,
  TemplateSvgPreview,
} from '@/features/paper-exams/lib/paper-exam-template-generator'

export function PaperExamVersionEditor({
  controller,
}: {
  controller: PaperExamTemplatesPageController
}) {
  const {
    selectedTemplate,
    selectedVersion,
    selectedVersionIsPublished,
    selectedTemplateImageAsset,
    editorDraft,
    setEditorDraft,
    jsonAssetDrafts,
    setJsonAssetDrafts,
    templateImageFile,
    metadataFieldDrafts,
    setMetadataFieldDrafts,
    validationResult,
    busyKey,
    setCloneDialogOpen,
    setPublishDialogOpen,
    handleSaveVersion,
    handleUploadTemplateImage,
    handleSaveJsonAssets,
    handleSaveMetadataFields,
    handleValidateVersion,
    handleTemplateImageChange,
  } = controller
  const versionPreviewExportRef = useRef<SVGSVGElement>(null)
  const [isExportingVersionPdf, setIsExportingVersionPdf] = useState(false)
  const selectedPreviewSettings = templateSettingsFromVersionValues({
    optionsPerQuestion: editorDraft.optionsPerQuestion,
    questionCount: editorDraft.questionCount,
  })

  const handleExportVersionPdf = async () => {
    if (!versionPreviewExportRef.current || isExportingVersionPdf) {
      return
    }

    setIsExportingVersionPdf(true)
    try {
      await exportTemplateSvgToPdf(
        versionPreviewExportRef.current,
        `${slugifyFileName(
          `${selectedTemplate?.code || selectedTemplate?.name || 'paper-exam-template'}-v${
            selectedVersion?.versionNumber ?? 'draft'
          }`,
        )}.pdf`,
      )
    } finally {
      setIsExportingVersionPdf(false)
    }
  }

  return (
        <CardShell className="p-6" variant="floating">
          <div className="space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
                  Trình chỉnh sửa phiên bản
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                  Tài nguyên nháp và trạng thái xuất bản
                </h2>
              </div>

              {selectedVersion ? (
                <Button
                  isLoading={busyKey === 'clone-version'}
                  leftIcon={<Copy className="size-4" />}
                  onClick={() => {
                    setCloneDialogOpen(true)
                  }}
                  variant="secondary"
                >
                  Nhân bản thành bản nháp
                </Button>
              ) : null}
            </div>

            {!selectedVersion ? (
              <p className="text-sm leading-6 text-muted">
                Chọn một phiên bản để chỉnh sửa, xác thực hoặc xuất bản.
              </p>
            ) : (
              <>
                <VersionStatusCard version={selectedVersion} />

                {selectedVersionIsPublished ? (
                  <Notice tone="success" title="Các phiên bản đã xuất bản chỉ có thể đọc">
                    Nhân bản phiên bản này thành bản nháp trước khi chỉnh sửa trường, tài nguyên hoặc cài đặt.
                  </Notice>
                ) : null}

                <Tabs defaultValue="preview" className="mt-4">
                  <TabsList className="mb-4 flex flex-wrap">
                    <TabsTrigger value="preview">Live Preview</TabsTrigger>
                    <TabsTrigger value="settings">Cài đặt cốt lõi</TabsTrigger>
                    <TabsTrigger value="assets">Tài nguyên</TabsTrigger>
                    <TabsTrigger value="metadata">Siêu dữ liệu</TabsTrigger>
                    <TabsTrigger value="validation">Xác thực & Xuất bản</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="space-y-4">
                    {selectedTemplate ? (
                      <TemplatePreviewSummary
                        template={selectedTemplate}
                        templateImageHash={selectedTemplateImageAsset?.contentHash ?? ''}
                        version={selectedVersion}
                      />
                    ) : null}

                    <div className="space-y-3 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-ink">Live OMR preview</p>
                          <p className="mt-1 text-sm leading-6 text-muted">
                            Preview follows the selected version question and option
                            counts. JSON assets remain editable below for advanced
                            calibration.
                          </p>
                        </div>
                        <Badge tone="neutral" variant="outline">
                          {editorDraft.questionCount || selectedVersion.questionCount} questions
                        </Badge>
                      </div>
                      <div className="overflow-hidden rounded-[calc(var(--radius-panel)-0.5rem)] border border-line bg-white">
                        <TemplateSvgPreview
                          className="block h-auto w-full"
                          settings={selectedPreviewSettings}
                        />
                      </div>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none fixed -left-[10000px] top-0 size-px overflow-hidden"
                      >
                        <TemplateSvgPreview
                          ref={versionPreviewExportRef}
                          settings={selectedPreviewSettings}
                          showOutlines={false}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          isLoading={isExportingVersionPdf}
                          leftIcon={<FileDown className="size-4" />}
                          onClick={() => {
                            void handleExportVersionPdf()
                          }}
                          variant="secondary"
                        >
                          Xuất PDF
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4 rounded-[var(--radius-panel)] border border-brand/20 bg-brand-soft/15 p-4 shadow-[var(--shadow-panel)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">Cài đặt cốt lõi</p>
                        <TemplateStatusBadge status={selectedVersion.status} />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Phiên bản lược đồ"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              schemaVersion: event.target.value,
                            }))
                          }
                          value={editorDraft.schemaVersion}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Phiên bản lược đồ tải trọng"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              payloadSchemaVersion: event.target.value,
                            }))
                          }
                          value={editorDraft.payloadSchemaVersion}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Số câu hỏi"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              questionCount: event.target.value,
                            }))
                          }
                          type="number"
                          value={editorDraft.questionCount}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Số lựa chọn mỗi câu"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              optionsPerQuestion: event.target.value,
                            }))
                          }
                          type="number"
                          value={editorDraft.optionsPerQuestion}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Ngưỡng tuyệt đối"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              absThreshold: event.target.value,
                            }))
                          }
                          value={editorDraft.absThreshold}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Ngưỡng tương đối"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              relThreshold: event.target.value,
                            }))
                          }
                          value={editorDraft.relThreshold}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Phương pháp chấm"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              scoringMethod: event.target.value,
                            }))
                          }
                          value={editorDraft.scoringMethod}
                        />
                        <TextField
                          disabled={selectedVersionIsPublished}
                          label="Phiên bản ứng dụng tối thiểu"
                          onChange={(event) =>
                            setEditorDraft((current) => ({
                              ...current,
                              minClientAppVersion: event.target.value,
                            }))
                          }
                          value={editorDraft.minClientAppVersion}
                        />
                      </div>

                      <TextareaField
                        disabled={selectedVersionIsPublished}
                        label="Tham số chấm JSON"
                        onChange={(event) =>
                          setEditorDraft((current) => ({
                            ...current,
                            scoringParamsJson: event.target.value,
                          }))
                        }
                        rows={4}
                        value={editorDraft.scoringParamsJson}
                      />

                      <Button
                        disabled={selectedVersionIsPublished}
                        isLoading={busyKey === 'save-version'}
                        onClick={() => {
                          void handleSaveVersion()
                        }}
                      >
                        Lưu các trường phiên bản
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="assets" className="space-y-4">
                    <div className="space-y-4 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                      <p className="text-sm font-semibold text-ink">Tài nguyên mẫu</p>

                      <div className="space-y-3 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]">
                        <div className="space-y-1">
                          <p className="text-base font-medium text-ink">Hình ảnh mẫu</p>
                          <p className="text-sm text-muted">
                            Mã băm hiện tại:{' '}
                            {selectedTemplateImageAsset?.contentHash || 'Chưa tải lên'}
                          </p>
                        </div>

                        <label className="block text-base font-medium text-ink" htmlFor="template-image-upload">
                          Tải tệp hình ảnh lên
                        </label>
                        <input
                          className="block w-full rounded-[var(--radius-input)] border border-line/80 bg-panel px-4 py-3 text-base text-ink shadow-[var(--shadow-subtle)]"
                          disabled={selectedVersionIsPublished}
                          id="template-image-upload"
                          onChange={handleTemplateImageChange}
                          type="file"
                        />

                        <Button
                          disabled={selectedVersionIsPublished || !templateImageFile}
                          isLoading={busyKey === 'upload-template-image'}
                          leftIcon={<Upload className="size-4" />}
                          onClick={() => {
                            void handleUploadTemplateImage()
                          }}
                          variant="secondary"
                        >
                          Tải hình ảnh mẫu lên
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {jsonAssetTypes.map((assetType) => {
                          const existingAsset = getAssetByType(selectedVersion, assetType)

                          return (
                            <div
                              className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]"
                              key={assetType}
                            >
                              <TextareaField
                                disabled={selectedVersionIsPublished}
                                hint={`Mã băm hiện tại: ${existingAsset?.contentHash || 'Chưa tải lên'}`}
                                label={`${assetType} JSON`}
                                onChange={(event) =>
                                  setJsonAssetDrafts((current) => ({
                                    ...current,
                                    [assetType]: event.target.value,
                                  }))
                                }
                                rows={5}
                                value={jsonAssetDrafts[assetType]}
                              />
                            </div>
                          )
                        })}
                      </div>

                      <Button
                        disabled={selectedVersionIsPublished}
                        isLoading={busyKey === 'save-json-assets'}
                        onClick={() => {
                          void handleSaveJsonAssets()
                        }}
                        variant="secondary"
                      >
                        Lưu tài nguyên JSON
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="metadata" className="space-y-4">
                    <div className="space-y-4 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-ink">Trường siêu dữ liệu</p>
                        <Button
                          disabled={selectedVersionIsPublished}
                          onClick={() => {
                            setMetadataFieldDrafts((current) => [
                              ...current,
                              { ...emptyMetadataFieldDraft },
                            ])
                          }}
                          size="md"
                          variant="secondary"
                        >
                          Thêm trường siêu dữ liệu
                        </Button>
                      </div>

                      {metadataFieldDrafts.length === 0 ? (
                        <p className="text-sm leading-6 text-muted">
                          Chưa cấu hình trường siêu dữ liệu nào.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {metadataFieldDrafts.map((field, index) => (
                            <div
                              className="rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-subtle)]"
                              key={`${field.fieldCode || 'field'}-${index}`}
                            >
                              <div className="grid gap-4 lg:grid-cols-2">
                                <TextField
                                  disabled={selectedVersionIsPublished}
                                  label="Mã trường"
                                  onChange={(event) =>
                                    setMetadataFieldDrafts((current) =>
                                      current.map((candidate, candidateIndex) =>
                                        candidateIndex === index
                                          ? {
                                              ...candidate,
                                              fieldCode: event.target.value,
                                            }
                                          : candidate,
                                      ),
                                    )
                                  }
                                  value={field.fieldCode}
                                />
                                <TextField
                                  disabled={selectedVersionIsPublished}
                                  label="Nhãn"
                                  onChange={(event) =>
                                    setMetadataFieldDrafts((current) =>
                                      current.map((candidate, candidateIndex) =>
                                        candidateIndex === index
                                          ? { ...candidate, label: event.target.value }
                                          : candidate,
                                      ),
                                    )
                                  }
                                  value={field.label}
                                />
                                <TextField
                                  disabled={selectedVersionIsPublished}
                                  label="Chế độ giải mã"
                                  onChange={(event) =>
                                    setMetadataFieldDrafts((current) =>
                                      current.map((candidate, candidateIndex) =>
                                        candidateIndex === index
                                          ? {
                                              ...candidate,
                                              decodeMode: event.target.value,
                                            }
                                          : candidate,
                                      ),
                                    )
                                  }
                                  value={field.decodeMode}
                                />
                                <CheckboxField
                                  checked={field.isRequired}
                                  label="Trường bắt buộc"
                                  onChange={(event) =>
                                    setMetadataFieldDrafts((current) =>
                                      current.map((candidate, candidateIndex) =>
                                        candidateIndex === index
                                          ? {
                                              ...candidate,
                                              isRequired: event.target.checked,
                                            }
                                          : candidate,
                                      ),
                                    )
                                  }
                                />
                              </div>

                              <div className="mt-4 grid gap-4">
                                <TextareaField
                                  disabled={selectedVersionIsPublished}
                                  label="Hình học JSON"
                                  onChange={(event) =>
                                    setMetadataFieldDrafts((current) =>
                                      current.map((candidate, candidateIndex) =>
                                        candidateIndex === index
                                          ? {
                                              ...candidate,
                                              geometryJson: event.target.value,
                                            }
                                          : candidate,
                                      ),
                                    )
                                  }
                                  rows={4}
                                  value={field.geometryJson}
                                />
                                <TextareaField
                                  disabled={selectedVersionIsPublished}
                                  label="Chính sách xác thực JSON"
                                  onChange={(event) =>
                                    setMetadataFieldDrafts((current) =>
                                      current.map((candidate, candidateIndex) =>
                                        candidateIndex === index
                                          ? {
                                              ...candidate,
                                              validationPolicyJson:
                                                event.target.value,
                                            }
                                          : candidate,
                                      ),
                                    )
                                  }
                                  rows={4}
                                  value={field.validationPolicyJson}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        disabled={selectedVersionIsPublished}
                        isLoading={busyKey === 'save-metadata'}
                        onClick={() => {
                          void handleSaveMetadataFields()
                        }}
                        variant="secondary"
                      >
                        Lưu trường siêu dữ liệu
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="validation" className="space-y-4">
                    <div className="space-y-4 rounded-[var(--radius-panel)] border border-line/80 bg-panel p-4 shadow-[var(--shadow-subtle)]">
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={selectedVersionIsPublished}
                          isLoading={busyKey === 'validate-version'}
                          leftIcon={<Layers3 className="size-4" />}
                          onClick={() => {
                            void handleValidateVersion()
                          }}
                          variant="secondary"
                        >
                          Xác thực phiên bản
                        </Button>
                        <Button
                          disabled={selectedVersionIsPublished}
                          isLoading={busyKey === 'publish-version'}
                          leftIcon={<CheckCircle2 className="size-4" />}
                          onClick={() => {
                            setPublishDialogOpen(true)
                          }}
                        >
                          Xuất bản phiên bản
                        </Button>
                      </div>

                      {validationResult ? (
                        <ValidationSummary result={validationResult} />
                      ) : null}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </CardShell>
  )
}

function slugifyFileName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'paper-exam-template'
}
