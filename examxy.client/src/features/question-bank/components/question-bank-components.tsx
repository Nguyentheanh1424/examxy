import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'
import {
  BookImage,
  BookOpenText,
  CheckCircle2,
  FileText,
  GripVertical,
  ImagePlus,
  Pencil,
  PlusCircle,
  Archive,
  RotateCcw,
  Trash2,
  X,
  Clock,
  SignalMedium,
  Tag,
  MoreHorizontal,
  CheckSquare,
  GitCompare,
  SortAsc,
  Binary,
  ClipboardPaste,
  Video,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RichContentEditor } from '@/features/question-bank/components/rich-text-editor'
import { CardShell } from '@/components/ui/card-shell'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { Notice } from '@/components/ui/notice'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
  applyQuestionTypeDefaults,
  formatUtcDate,
  getCurrentVersion,
  getQuestionTypeDescription,
  getQuestionTypeGradingLabel,
  getQuestionTypeLabel,
  normalizeQuestionType,
  normalizeStatus,
  questionTypeOptions,
  richDocumentToPlainText,
  textToRichDocument,
  validateQuestionDraft,
  toDraftState,
  extractStemDocumentFromCanonicalContent,
  parseJsonUnknown,
  type DraftImageAttachment,
  type QuestionDraftState,
  type QuestionTypeValue,
} from '@/features/question-bank/lib/question-bank-display'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { Question, RichContentDocument } from '@/types/question-bank'

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={[
        'min-h-10 rounded-full border px-3 text-sm font-medium transition',
        active
          ? 'border-brand bg-brand text-white'
          : 'border-line bg-surface text-muted hover:border-brand/25 hover:bg-brand-soft/55 hover:text-ink',
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}


export function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-input)] border border-line bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}



function RichContentPreview({
  document,
  fallbackText = 'Chưa có nội dung.',
  attachments = [],
}: {
  document: RichContentDocument
  fallbackText?: string
  attachments?: DraftImageAttachment[]
}) {
  if (!document || !document.blocks || !document.blocks.length) {
    return <p className="text-sm text-muted">{fallbackText}</p>
  }

  return (
    <div className="space-y-3 text-base leading-7 text-ink">
      {document.blocks.map((block, blockIndex) => {
        if (block.type === 'paragraph') {
          return (
            <p key={blockIndex}>
              {block.inline?.map((node, nodeIndex) => {
                if (node.type === 'mathInline') {
                  return (
                    <span className="mx-1 text-brand-strong" key={nodeIndex}>
                      <InlineMath math={node.latex ?? ''} renderError={(error) => <code className="text-red-500">{error.message}</code>} />
                    </span>
                  )
                }

                return <span key={nodeIndex}>{node.text ?? node.value ?? ''}</span>
              })}
            </p>
          )
        }

        if (block.type === 'mathBlock') {
          return (
            <div
              className="rounded-[var(--radius-input)] border border-line bg-surface px-4 py-3 text-center"
              key={blockIndex}
            >
              <div className="text-base text-brand-strong">
                <BlockMath math={block.latex ?? ''} renderError={(error) => <code className="text-red-500">{error.message}</code>} />
              </div>
            </div>
          )
        }

        if (block.type === 'image') {
          const attachment = attachments.find((a) => a.id === block.attachmentId)

          return (
            <figure className="rounded-[var(--radius-input)] border border-line bg-surface p-3" key={blockIndex}>
              <div className="flex flex-col items-center justify-center overflow-hidden rounded-[var(--radius-input)] bg-surface-alt">
                {attachment?.downloadUrl ? (
                  <img
                    alt={block.altText || attachment.altText || attachment.fileName}
                    className="max-h-96 w-auto object-contain"
                    src={attachment.downloadUrl}
                  />
                ) : (
                  <div className="flex h-28 items-center justify-center text-muted">
                    <BookImage className="size-6" />
                  </div>
                )}
              </div>
              {block.caption || attachment?.caption ? (
                <figcaption className="mt-2 text-center text-sm text-muted">
                  {block.caption || attachment?.caption}
                </figcaption>
              ) : null}
            </figure>
          )
        }

        return null
      })}
    </div>
  )
}
export function LatexRenderer({ text, className }: { text?: string; className?: string }) {
  if (!text) return null

  const pattern = /(\\\[(?:.|\n)*?\\\]|\\\((?:.|\n)*?\\\))/g
  const parts = text.split(pattern)

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const math = part.slice(2, -2).trim()
          return (
            <div className="my-2" key={index}>
              <BlockMath math={math} renderError={(error) => <code className="text-red-500">{error.message}</code>} />
            </div>
          )
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const math = part.slice(2, -2).trim()
          return (
            <span className="text-brand-strong font-normal" key={index}>
              <InlineMath math={math} renderError={(error) => <code className="text-red-500">{error.message}</code>} />
            </span>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

export function QuestionFormCard({
  allowedQuestionTypes,
  availableTags,
  busyKey,
  draft,
  formId,
  heading,
  onDraftChange,
  onImageUpload,
  onSubmit,
  submitLabel,
  title,
  unframed = false,
}: {
  allowedQuestionTypes?: QuestionTypeValue[]
  availableTags: string[]
  busyKey: string | null
  draft: QuestionDraftState
  formId?: string
  heading: string
  onDraftChange: (next: QuestionDraftState | ((current: QuestionDraftState) => QuestionDraftState)) => void
  onImageUpload?: (file: File) => Promise<void>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: string
  title: string
  unframed?: boolean
}) {
  const validationMessage = validateQuestionDraft(draft)

  const form = (
    <form aria-label={title} className="space-y-5" id={formId} onSubmit={onSubmit}>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
          {title}
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
          {heading}
        </h2>
      </div>

      <QuestionTypePicker
        allowedQuestionTypes={allowedQuestionTypes}
        onChange={(questionType) => {
          onDraftChange((current) => applyQuestionTypeDefaults(current, questionType))
        }}
        value={draft.questionType}
      />

      <RichContentEditor
        label="Nội dung câu hỏi"
        onChange={(stem) => onDraftChange((current) => ({ ...current, stem }))}
        value={draft.stem}
      />

      <QuestionAnswerBuilder
        draft={draft}
        onDraftChange={onDraftChange}
      />

      <StemImageAttachmentEditor
        draft={draft}
        onDraftChange={onDraftChange}
        onImageUpload={onImageUpload}
      />

      <RichContentEditor
        label={draft.questionType === 'MediaBased' ? 'Lời giải / hướng dẫn chấm' : 'Lời giải'}
        onChange={(explanation) => onDraftChange((current) => ({ ...current, explanation }))}
        value={draft.explanation}
      />

      <QuestionTagSelector
        availableTags={availableTags}
        onChange={(tags) => {
          onDraftChange((current) => ({ ...current, tags }))
        }}
        selectedTags={draft.tags}
      />

      <Accordion collapsible>
        <AccordionItem value="question-metadata">
          <AccordionTrigger>Thông tin bổ sung</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField
                  label="Độ khó"
                  onChange={(event) => onDraftChange((current) => ({ ...current, difficulty: event.target.value }))}
                  value={draft.difficulty}
                />
                <TextField
                  label="Thời gian ước tính (giây)"
                  onChange={(event) => onDraftChange((current) => ({ ...current, estimatedSeconds: event.target.value }))}
                  type="number"
                  value={draft.estimatedSeconds}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <QuestionDraftPreview draft={draft} />

      {validationMessage ? (
        <Notice tone="warning" title="Chưa thể tạo câu hỏi">
          {validationMessage}
        </Notice>
      ) : null}

      <Button
        disabled={Boolean(validationMessage)}
        isLoading={busyKey === 'create-question' || busyKey?.startsWith('update-')}
        leftIcon={<PlusCircle className="size-4" />}
        type="submit"
      >
        {submitLabel}
      </Button>
    </form>
  )

  if (unframed) {
    return form
  }

  return (
    <CardShell className="p-6 sm:p-8">
      {form}
    </CardShell>
  )
}

function QuestionDraftPreview({ draft }: { draft: QuestionDraftState }) {
  return (
    <CardShell accentTone="brand" className="overflow-hidden" variant="subtle">
      <div className="border-b border-line/50 bg-surface-alt/40 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpenText className="size-4 text-brand-strong" />
          <span className="text-sm font-bold uppercase tracking-wider text-ink">Xem trước hiển thị</span>
        </div>
        <Badge tone="primary" variant="soft">{getQuestionTypeLabel(draft.questionType)}</Badge>
      </div>

      <div className="p-5">
        <QuestionStudentView draft={draft} />
      </div>
    </CardShell>
  )
}

function QuestionStudentView({
  draft,
  showExplanation = true,
  showCorrectAnswers = true,
}: {
  draft: QuestionDraftState
  showExplanation?: boolean
  showCorrectAnswers?: boolean
}) {
  const questionType = normalizeQuestionType(draft.questionType)
  const choices = draft.choices.filter((choice) => richDocumentToPlainText(choice.content))

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <RichContentPreview
          attachments={draft.imageAttachments}
          document={draft.stem}
          fallbackText="Nhập nội dung câu hỏi để xem trước tại đây."
        />
      </div>

      {questionType === 'SingleChoice' || questionType === 'MultipleChoice' ? (
        <div className="space-y-3">
          {choices.map((choice, index) => {
            const correct = questionType === 'SingleChoice'
              ? draft.correctChoice === choice.id
              : draft.correctChoices.includes(choice.id)

            return (
              <div
                className={[
                  'grid gap-3 rounded-[var(--radius-input)] border p-4 sm:grid-cols-[auto_minmax(0,1fr)] transition-colors',
                  (showCorrectAnswers && correct) ? 'border-success/40 bg-success-soft/30' : 'border-line/60 bg-surface-alt/30',
                ].join(' ')}
                key={choice.id}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-surface font-bold text-ink shadow-sm border border-line/50">
                  {choiceIdForDisplay(index)}
                </span>
                <div>
                  <RichContentPreview
                    attachments={draft.imageAttachments}
                    document={choice.content}
                  />
                  {showCorrectAnswers && correct ? (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-success-strong">
                      <CheckCircle2 className="size-3.5" />
                      Đáp án đúng
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {questionType === 'TrueFalse' ? (
        <div className="rounded-[calc(var(--radius-input)+0.25rem)] border border-success/30 bg-success-soft/30 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-success-strong">
            <CheckCircle2 className="size-4" />
            Đáp án đúng: {draft.trueFalseAnswer === 'true' ? 'Đúng' : 'Sai'}
          </div>
        </div>
      ) : null}

      {questionType === 'Matching' ? (
        <div className="space-y-3">
          {draft.matchingPairs.map((pair, index) => (
            <div
              className="grid gap-4 rounded-[var(--radius-input)] border border-line/60 bg-surface-alt/30 p-4 sm:grid-cols-[1fr_auto_1fr]"
              key={index}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted">Vế trái</span>
                <p className="text-sm font-medium text-ink">{pair.left}</p>
              </div>
              <div className="flex items-center justify-center">
                <GripVertical className="size-4 text-muted/40" />
              </div>
              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase text-muted">Vế phải</span>
                <p className="text-sm font-bold text-brand-strong">{pair.right}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {questionType === 'Ordering' ? (
        <div className="space-y-3">
          {draft.orderingItems.map((item, index) => (
            <div
              className="flex items-center gap-4 rounded-[var(--radius-input)] border border-line/60 bg-surface-alt/30 p-4"
              key={index}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-sm">
                {index + 1}
              </span>
              <p className="text-sm font-medium text-ink">{item}</p>
            </div>
          ))}
        </div>
      ) : null}

      {questionType === 'MediaBased' ? (
        <div className="rounded-[var(--radius-input)] border border-brand/20 bg-brand-soft/10 p-4">
          <p className="text-sm font-bold text-brand-strong">Lời dẫn/Yêu cầu:</p>
          <p className="mt-2 text-sm leading-6 text-ink">{draft.mediaPrompt || 'Không có lời dẫn/yêu cầu đính kèm.'}</p>
        </div>
      ) : null}

      {showExplanation && richDocumentToPlainText(draft.explanation) ? (
        <div className="mt-6 rounded-[var(--radius-input)] border border-line/60 bg-surface-alt/40 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted">Lời giải chi tiết</p>
          <RichContentPreview
            attachments={draft.imageAttachments}
            document={draft.explanation}
          />
        </div>
      ) : null}
    </div>
  )
}

function choiceIdForDisplay(index: number) {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

function StemImageAttachmentEditor({
  draft,
  onDraftChange,
  onImageUpload,
}: {
  draft: QuestionDraftState
  onDraftChange: (next: QuestionDraftState | ((current: QuestionDraftState) => QuestionDraftState)) => void
  onImageUpload?: (file: File) => Promise<void>
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onImageUpload) {
      return
    }

    setIsUploading(true)
    setError(null)
    try {
      await onImageUpload(file)
    } catch {
      setError('Không thể tải ảnh lên.')
    } finally {
      setIsUploading(false)
    }
  }

  function removeImage(attachmentId: string) {
    onDraftChange((current) => ({
      ...current,
      imageAttachments: current.imageAttachments.filter((attachment) => attachment.id !== attachmentId),
    }))
  }

  function updateImage(
    attachmentId: string,
    patch: Partial<{ altText: string; caption: string }>,
  ) {
    onDraftChange((current) => ({
      ...current,
      imageAttachments: current.imageAttachments.map((attachment) => (
        attachment.id === attachmentId ? { ...attachment, ...patch } : attachment
      )),
    }))
  }

  return (
    <section className="space-y-3 rounded-[var(--radius-input)] border border-line bg-surface-alt/45 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-ink">Tệp / hình ảnh đính kèm</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Tải ảnh, tài liệu, audio hoặc video dùng trong câu hỏi.
          </p>
        </div>
        <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink transition hover:border-brand/30 hover:bg-brand-soft/45">
          <ImagePlus className="size-4 text-brand-strong" />
          {isUploading ? 'Đang tải' : 'Tải ảnh'}
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={isUploading || !onImageUpload}
            onChange={(event) => { void handleFileChange(event) }}
            type="file"
          />
        </label>
      </div>

      {error ? (
        <p className="text-sm font-medium text-danger">{error}</p>
      ) : null}

      {draft.imageAttachments.length > 0 ? (
        <div className="space-y-3">
          {draft.imageAttachments.map((attachment) => (
            <div
              className="grid gap-3 rounded-[var(--radius-input)] border border-line bg-surface p-3"
              key={attachment.id}
            >
              <div className="flex items-start gap-3">
                {attachment.downloadUrl ? (
                  <img
                    alt={attachment.altText || attachment.fileName}
                    className="h-20 w-28 rounded-[var(--radius-input)] border border-line object-cover"
                    src={attachment.downloadUrl}
                  />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded-[var(--radius-input)] border border-line bg-surface-alt text-muted">
                    <ImagePlus className="size-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{attachment.fileName}</p>
                  <p className="text-xs text-muted">
                    {attachment.contentType} - {attachment.fileSizeBytes} bytes
                  </p>
                </div>
                <Button
                  aria-label={`Xóa ảnh ${attachment.fileName}`}
                  leftIcon={<Trash2 className="size-4" />}
                  onClick={() => removeImage(attachment.id)}
                  type="button"
                  variant="ghost"
                >
                  Xóa
                </Button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <TextField
                  label="Alt text"
                  onChange={(event) => updateImage(attachment.id, { altText: event.target.value })}
                  value={attachment.altText}
                />
                <TextField
                  label="Caption"
                  onChange={(event) => updateImage(attachment.id, { caption: event.target.value })}
                  value={attachment.caption}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function QuestionTagSelector({
  availableTags,
  onChange,
  selectedTags,
}: {
  availableTags: string[]
  onChange: (tags: string[]) => void
  selectedTags: string[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const tagOptions = useMemo(() => {
    const all = Array.from(new Set([...availableTags, ...selectedTags]))
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second))
    return all
  }, [availableTags, selectedTags])

  function toggleTag(tag: string) {
    onChange(
      selectedTags.includes(tag)
        ? selectedTags.filter((candidate) => candidate !== tag)
        : [...selectedTags, tag],
    )
  }

  function handleCreate() {
    const nextTag = query.trim()
    if (!nextTag) return

    const exists = selectedTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())
    if (!exists) {
      onChange([...selectedTags, nextTag])
    }
    setQuery('')
    setOpen(false)
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-base font-medium tracking-[0.01em] text-ink">Thẻ phân loại</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Chọn thẻ đã có hoặc tạo thẻ mới để tìm và lọc câu hỏi dễ hơn (ví dụ: Toán 10, Hàm số).
        </p>
      </div>

      <Popover onOpenChange={setOpen} open={open} align="start">
        <PopoverTrigger asChild>
          <div
            aria-label="Chọn thẻ phân loại"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpen(!open)
              }
            }}
            className="focus-ring flex min-h-11 w-full items-center justify-between gap-3 rounded-[var(--radius-input)] border border-line bg-surface px-4 py-2 text-left transition hover:border-brand/25 cursor-pointer"
          >
            <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => (
                <Badge
                  className="gap-1 px-2 py-0.5"
                  key={tag}
                  tone="primary"
                  variant="soft"
                >
                  {tag}
                  <button
                    aria-label={`Xóa thẻ ${tag}`}
                    className="ml-1 rounded-full p-0.5 transition hover:bg-brand/20 hover:text-brand-strong"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleTag(tag)
                    }}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted">Chọn hoặc tạo thẻ phân loại...</span>
            )}
          </div>
          <PlusCircle className="size-4 shrink-0 text-muted" />
        </div>
      </PopoverTrigger>
        <PopoverContent className="w-[min(calc(100vw-3rem),24rem)] p-0">
          <Command className="border-none shadow-none">
            <CommandInput
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && query) {
                  event.preventDefault()
                  handleCreate()
                }
              }}
              placeholder="Tìm hoặc nhập tên thẻ mới..."
              value={query}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center gap-3 py-3">
                  <p className="text-sm text-muted">Không tìm thấy thẻ nào.</p>
                  {query ? (
                    <Button
                      leftIcon={<PlusCircle className="size-4" />}
                      onClick={handleCreate}
                      size="sm"
                      variant="secondary"
                    >
                      Tạo thẻ "{query}"
                    </Button>
                  ) : null}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {tagOptions.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <CommandItem
                      className="flex cursor-pointer items-center justify-between"
                      key={tag}
                      onSelect={() => {
                        toggleTag(tag)
                      }}
                      value={tag}
                    >
                      <span>{tag}</span>
                      {isSelected ? (
                        <CheckCircle2 className="size-4 text-brand-strong" />
                      ) : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </section>
  )
}

function QuestionTypePicker({
  allowedQuestionTypes,
  onChange,
  value,
}: {
  allowedQuestionTypes?: QuestionTypeValue[]
  onChange: (questionType: QuestionTypeValue) => void
  value: QuestionTypeValue
}) {
  const options = allowedQuestionTypes
    ? questionTypeOptions.filter((option) => allowedQuestionTypes.includes(option.value))
    : questionTypeOptions

  return (
    <section className="space-y-3">
      <div>
        <p className="text-base font-medium tracking-[0.01em] text-ink">Loại câu hỏi</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Chọn cách hệ thống sẽ hiển thị và chấm câu hỏi này.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => {
          const active = value === option.value

          return (
            <button
              aria-pressed={active}
              className={[
                'min-h-24 rounded-[var(--radius-input)] border p-4 text-left transition',
                active
                  ? 'border-brand bg-brand-soft/70 ring-2 ring-focus/25'
                  : 'border-line bg-surface hover:border-brand/30 hover:bg-brand-soft/35',
              ].join(' ')}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-semibold text-ink">{option.label}</span>
                <Badge tone={option.value === 'MediaBased' ? 'warning' : 'success'} variant="soft">
                  {getQuestionTypeGradingLabel(option.value)}
                </Badge>
              </span>
              <span className="mt-2 block text-sm leading-6 text-muted">
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function QuestionAnswerBuilder({
  draft,
  onDraftChange,
}: {
  draft: QuestionDraftState
  onDraftChange: (next: QuestionDraftState | ((current: QuestionDraftState) => QuestionDraftState)) => void
}) {
  return (
    <section className="space-y-4 rounded-[var(--radius-input)] border border-line bg-surface-alt/45 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-ink">{getQuestionTypeLabel(draft.questionType)}</p>
          <p className="text-sm leading-6 text-muted">{getQuestionTypeDescription(draft.questionType)}</p>
        </div>
        <Badge tone={draft.questionType === 'MediaBased' ? 'warning' : 'success'} variant="soft">
          {getQuestionTypeGradingLabel(draft.questionType)}
        </Badge>
      </div>

      {draft.questionType === 'SingleChoice' ? (
        <ChoiceBuilder
          choices={draft.choices}
          correctChoice={draft.correctChoice}
          mode="single"
          onChange={(choices) => {
            const choiceIds = choices.map((choice) => choice.id)
            onDraftChange((current) => ({
              ...current,
              choices,
              correctChoice: choiceIds.includes(current.correctChoice)
                ? current.correctChoice
                : choiceIds[0] ?? '',
              correctChoices: current.correctChoices.filter((choice) => choiceIds.includes(choice)),
            }))
          }}
          onCorrectChoiceChange={(correctChoice) => {
            onDraftChange((current) => ({
              ...current,
              correctChoice,
              correctChoices: [correctChoice],
            }))
          }}
        />
      ) : null}

      {draft.questionType === 'MultipleChoice' ? (
        <ChoiceBuilder
          choices={draft.choices}
          correctChoices={draft.correctChoices}
          mode="multiple"
          onChange={(choices) => {
            const choiceIds = choices.map((choice) => choice.id)
            onDraftChange((current) => ({
              ...current,
              choices,
              correctChoice: choiceIds.includes(current.correctChoice)
                ? current.correctChoice
                : choiceIds[0] ?? '',
              correctChoices: current.correctChoices.filter((choice) => choiceIds.includes(choice)),
            }))
          }}
          onCorrectChoicesChange={(correctChoices) => {
            onDraftChange((current) => ({ ...current, correctChoices }))
          }}
        />
      ) : null}

      {draft.questionType === 'TrueFalse' ? (
        <TrueFalseBuilder
          onChange={(trueFalseAnswer) => {
            onDraftChange((current) => ({ ...current, trueFalseAnswer }))
          }}
          value={draft.trueFalseAnswer}
        />
      ) : null}

      {draft.questionType === 'Matching' ? (
        <MatchingBuilder
          onChange={(matchingPairs) => {
            onDraftChange((current) => ({ ...current, matchingPairs }))
          }}
          pairs={draft.matchingPairs}
        />
      ) : null}

      {draft.questionType === 'Ordering' ? (
        <OrderingBuilder
          items={draft.orderingItems}
          onChange={(orderingItems) => {
            onDraftChange((current) => ({ ...current, orderingItems }))
          }}
        />
      ) : null}

      {draft.questionType === 'MediaBased' ? (
        <TextareaField
          hint="Dán link hoặc mô tả file/hình/audio/video học sinh cần xem."
          label="Tài liệu / media cần xem"
          onChange={(event) => {
            onDraftChange((current) => ({ ...current, mediaPrompt: event.target.value }))
          }}
          rows={4}
          value={draft.mediaPrompt}
        />
      ) : null}

    </section>
  )
}

function ChoiceBuilder({
  choices,
  correctChoice,
  correctChoices = [],
  mode,
  onChange,
  onCorrectChoiceChange,
  onCorrectChoicesChange,
}: {
  choices: QuestionDraftState['choices']
  correctChoice?: string
  correctChoices?: string[]
  mode: 'single' | 'multiple'
  onChange: (choices: QuestionDraftState['choices']) => void
  onCorrectChoiceChange?: (correctChoice: string) => void
  onCorrectChoicesChange?: (correctChoices: string[]) => void
}) {
  function updateChoice(index: number, content: RichContentDocument) {
    const currentChoice = choices[index]
    if (!currentChoice) return

    const nextChoices = choices.map((choice, choiceIndex) => (
      choiceIndex === index ? { ...currentChoice, content } : choice
    ))
    onChange(nextChoices)
  }

  function removeChoice(index: number) {
    onChange(choices.filter((_, choiceIndex) => choiceIndex !== index))
  }

  function toggleCorrectChoice(choiceId: string) {
    if (mode === 'single') {
      onCorrectChoiceChange?.(choiceId)
      return
    }

    onCorrectChoicesChange?.(
      correctChoices.includes(choiceId)
        ? correctChoices.filter((candidate) => candidate !== choiceId)
        : [...correctChoices, choiceId],
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-input)] border border-line bg-surface p-3">
        <p className="text-sm font-semibold text-ink">
          Đáp án đúng hiện chọn
        </p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {getSelectedChoiceSummary(mode, correctChoice, correctChoices)}
        </p>
      </div>

      {choices.map((choice, index) => {
        const isCorrect = mode === 'single'
          ? correctChoice === choice.id
          : correctChoices.includes(choice.id)
        const hasContent = Boolean(richDocumentToPlainText(choice.content))

        return (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_8rem_auto]" key={index}>
            <RichContentEditor
              label={`Lựa chọn ${index + 1}`}
              onChange={(content) => updateChoice(index, content)}
              value={choice.content}
            />
            <button
              aria-pressed={isCorrect}
              className={[
                'mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-input)] border px-3 text-sm font-semibold transition md:mt-8',
                isCorrect
                  ? 'border-success bg-success-soft text-success-strong'
                  : 'border-line bg-surface text-muted hover:border-brand/25 hover:text-ink',
              ].join(' ')}
              disabled={!hasContent}
              onClick={() => toggleCorrectChoice(choice.id)}
              type="button"
            >
              <CheckCircle2 className="size-4" />
              Đáp án đúng
            </button>
            <Button
              aria-label={`Xóa lựa chọn ${index + 1}`}
              disabled={choices.length <= 2}
              leftIcon={<Trash2 className="size-4" />}
              onClick={() => removeChoice(index)}
              type="button"
              variant="ghost"
            >
              Xóa
            </Button>
          </div>
        )
      })}

      <Button
        leftIcon={<PlusCircle className="size-4" />}
        onClick={() => onChange([
          ...choices,
          {
            id: choiceIdForDisplay(choices.length),
            content: textToRichDocument(`Lựa chọn ${choices.length + 1}`),
          },
        ])}
        type="button"
        variant="secondary"
      >
        Thêm lựa chọn
      </Button>
    </div>
  )
}

function getSelectedChoiceSummary(
  mode: 'single' | 'multiple',
  correctChoice: string | undefined,
  correctChoices: string[],
) {
  if (mode === 'single') {
    return correctChoice?.trim()
      ? `Một đáp án: ${correctChoice}`
      : 'Chưa chọn đáp án đúng.'
  }

  return correctChoices.length > 0
    ? `Nhiều đáp án: ${correctChoices.join(', ')}`
    : 'Chưa chọn đáp án đúng.'
}

function TrueFalseBuilder({
  onChange,
  value,
}: {
  onChange: (value: 'true' | 'false') => void
  value: 'true' | 'false'
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-[var(--radius-input)] border border-line bg-surface p-3">
        <p className="text-sm font-semibold text-ink">Đáp án đúng hiện chọn</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {value === 'true' ? 'Đúng' : 'Sai'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { value: 'true' as const, label: 'Đúng' },
          { value: 'false' as const, label: 'Sai' },
        ].map((option) => (
          <button
            aria-pressed={value === option.value}
            className={[
              'min-h-14 rounded-[var(--radius-input)] border px-4 text-base font-semibold transition',
              value === option.value
                ? 'border-brand bg-brand-soft/70 text-brand-strong ring-2 ring-focus/25'
                : 'border-line bg-surface text-muted hover:border-brand/25 hover:text-ink',
            ].join(' ')}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchingBuilder({
  onChange,
  pairs,
}: {
  onChange: (pairs: { left: string; right: string }[]) => void
  pairs: { left: string; right: string }[]
}) {
  function updatePair(index: number, field: 'left' | 'right', value: string) {
    onChange(pairs.map((pair, pairIndex) => (
      pairIndex === index ? { ...pair, [field]: value } : pair
    )))
  }

  return (
    <div className="space-y-3">
      {pairs.map((pair, index) => (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" key={index}>
          <TextField
            label={`Vế trái ${index + 1}`}
            onChange={(event) => updatePair(index, 'left', event.target.value)}
            value={pair.left}
          />
          <TextField
            label={`Vế phải ${index + 1}`}
            onChange={(event) => updatePair(index, 'right', event.target.value)}
            value={pair.right}
          />
          <Button
            aria-label={`Xóa cặp ${index + 1}`}
            disabled={pairs.length <= 2}
            leftIcon={<Trash2 className="size-4" />}
            onClick={() => onChange(pairs.filter((_, pairIndex) => pairIndex !== index))}
            type="button"
            variant="ghost"
          >
            Xóa
          </Button>
        </div>
      ))}
      <Button
        leftIcon={<PlusCircle className="size-4" />}
        onClick={() => onChange([...pairs, { left: '', right: '' }])}
        type="button"
        variant="secondary"
      >
        Thêm cặp
      </Button>
    </div>
  )
}

function OrderingBuilder({
  items,
  onChange,
}: {
  items: string[]
  onChange: (items: string[]) => void
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]" key={index}>
          <div className="mt-8 flex size-11 items-center justify-center rounded-[var(--radius-input)] border border-line bg-surface text-muted">
            <GripVertical className="size-4" />
          </div>
          <TextField
            label={`Thứ tự ${index + 1}`}
            onChange={(event) => {
              onChange(items.map((candidate, itemIndex) => itemIndex === index ? event.target.value : candidate))
            }}
            value={item}
          />
          <Button
            aria-label={`Xóa mục ${index + 1}`}
            disabled={items.length <= 2}
            leftIcon={<Trash2 className="size-4" />}
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            type="button"
            variant="ghost"
          >
            Xóa
          </Button>
        </div>
      ))}
      <Button
        leftIcon={<PlusCircle className="size-4" />}
        onClick={() => onChange([...items, `Mục ${items.length + 1}`])}
        type="button"
        variant="secondary"
      >
        Thêm mục
      </Button>
    </div>
  )
}

export function QuestionPreviewPanel({
  busyKey,
  editId,
  onArchive,
  onDeletePermanently,
  onEdit,
  onRestore,
  question,
}: {
  busyKey: string | null
  editId: string | null
  onArchive: (id: string) => void
  onDeletePermanently: (id: string) => void
  onEdit: (q: Question) => void
  onRestore: (id: string) => void
  question: Question
}) {
  const currentVersion = getCurrentVersion(question)
  const isEditing = editId === question.id
  const [jsonTab, setJsonTab] = useState<'content' | 'details'>('content')

  return (
    <CardShell className="overflow-hidden shadow-lg border-line/60" variant="elevated">
      <div className="border-b border-line/50 bg-surface-alt/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="info" variant="solid">#{question.code}</Badge>
            <Badge tone="neutral" variant="soft">v{question.currentVersionNumber}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted">
            Cập nhật {formatUtcDate(question.updatedAtUtc)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            leftIcon={<BookOpenText className="size-4" />}
            onClick={() => onEdit(question)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Sửa câu hỏi
          </Button>
          {normalizeStatus(question.status) === 'Archived' ? (
            <>
              <Button
                isLoading={busyKey === `restore-${question.id}`}
                leftIcon={<RotateCcw className="size-4" />}
                onClick={() => onRestore(question.id)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Khôi phục
              </Button>
              <Button
                isLoading={busyKey === `delete-${question.id}`}
                leftIcon={<Trash2 className="size-4" />}
                onClick={() => onDeletePermanently(question.id)}
                size="sm"
                type="button"
                variant="danger"
              >
                Xóa
              </Button>
            </>
          ) : (
            <>
              <Button
                isLoading={busyKey === `archive-${question.id}`}
                leftIcon={<Archive className="size-4" />}
                onClick={() => onArchive(question.id)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Lưu trữ
              </Button>
              <Button
                isLoading={busyKey === `delete-${question.id}`}
                leftIcon={<Trash2 className="size-4" />}
                onClick={() => onDeletePermanently(question.id)}
                size="sm"
                type="button"
                variant="danger"
              >
                Xóa
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {currentVersion ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <MetaTile label="Loại câu hỏi" value={getQuestionTypeLabel(currentVersion.questionType)} />
              <MetaTile label="Độ khó" value={currentVersion.difficulty} />
              <MetaTile label="Thời gian ước tính" value={`${currentVersion.estimatedSeconds} giây`} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Thẻ phân loại</p>
              <div className="flex flex-wrap gap-2">
                {question.tags.length > 0 ? (
                  question.tags.map((tag) => (
                    <Badge key={tag} tone="primary" variant="soft">{tag}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted italic">Chưa có thẻ</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-line/40">
              <p className="mb-4 text-sm font-bold text-ink flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                Nội dung và Đáp án hiển thị
              </p>
              <QuestionStudentView draft={toDraftState(question)} />
            </div>

            <div className="pt-6 border-t border-line/40 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="size-4 text-brand-strong" />
                <p className="text-sm font-bold text-ink">dữ liệu câu hỏi</p>
              </div>
              
              <div className="space-y-4">
                <div className="inline-flex gap-1 rounded-full bg-surface-alt p-1">
                  <Button
                    onClick={() => setJsonTab('content')}
                    size="sm"
                    variant={jsonTab === 'content' ? 'primary' : 'ghost'}
                    className="rounded-full"
                  >
                    Nội dung câu hỏi
                  </Button>
                  <Button
                    onClick={() => setJsonTab('details')}
                    size="sm"
                    variant={jsonTab === 'details' ? 'primary' : 'ghost'}
                    className="rounded-full"
                  >
                    Chi tiết JSON
                  </Button>
                </div>
                
                <div className="rounded-[var(--radius-input)] border border-line bg-surface-alt/20 p-4">
                  {(() => {
                    const json = jsonTab === 'content' ? currentVersion.contentJson : currentVersion.answerKeyJson
                    try {
                      const parsed = JSON.parse(json)
                      return (
                        <pre className="overflow-auto text-[11px] font-mono leading-relaxed text-ink/80">
                          {JSON.stringify(parsed, null, 2)}
                        </pre>
                      )
                    } catch {
                      return <div className="text-sm font-medium text-danger">JSON không hợp lệ</div>
                    }
                  })()}
                </div>
              </div>
            </div>

            {currentVersion.attachments.length > 0 ? (
              <div className="space-y-3 pt-4 border-t border-line/40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Tệp đính kèm hệ thống</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentVersion.attachments.map((attachment) => (
                    <div
                      className="flex items-center gap-3 rounded-[var(--radius-input)] border border-line bg-surface p-3 transition hover:border-brand/30"
                      key={attachment.id}
                    >
                      <FileText className="size-4 shrink-0 text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{attachment.fileName}</p>
                        <p className="text-[10px] text-muted">
                          {attachment.contentType.split('/')[1]?.toUpperCase() || 'FILE'} • {(attachment.fileSizeBytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Notice tone="warning" title="Thiếu dữ liệu phiên bản">
            Câu hỏi này không có phiên bản hiện tại có thể đọc được.
          </Notice>
        )}

        {isEditing ? (
          <Notice tone="info" title="Đang sửa trong cửa sổ">
            Sử dụng cửa sổ chỉnh sửa để lưu hoặc hủy phiên bản câu hỏi mới.
          </Notice>
        ) : null}
      </div>
    </CardShell>
  )
}
export function QuestionListCard({
  isBulkMode = false,
  isItemSelected = false,
  isSelected,
  onArchive,
  onDeletePermanently,
  onEdit,
  onPreview,
  onRestore,
  onSelect,
  onToggleSelection,
  question,
}: {
  isBulkMode?: boolean
  isItemSelected?: boolean
  isSelected: boolean
  onArchive: (id: string) => void
  onDeletePermanently: (id: string) => void
  onEdit: (q: Question) => void
  onPreview: (id: string) => void
  onRestore: (id: string) => void
  onSelect: (id: string) => void
  onToggleSelection?: (id: string) => void
  question: Question
}) {
  const currentVersion = getCurrentVersion(question)
  const questionType = normalizeQuestionType(currentVersion?.questionType ?? 'SingleChoice')

  const stemText = useMemo(() => {
    if (!currentVersion?.contentJson) return currentVersion?.stemPlainText || ''
    const parsed = parseJsonUnknown(currentVersion.contentJson)
    const stemDoc = extractStemDocumentFromCanonicalContent(parsed)
    return richDocumentToPlainText(stemDoc) || currentVersion.stemPlainText || ''
  }, [currentVersion])

  const TypeIcon = useMemo(() => {
    switch (questionType) {
      case 'SingleChoice':
      case 'MultipleChoice':
        return CheckSquare
      case 'Matching':
        return GitCompare
      case 'Ordering':
        return SortAsc
      case 'TrueFalse':
        return Binary
      case 'MediaBased':
        return Video
      default:
        return FileText
    }
  }, [questionType])

  return (
    <CardShell
      accentTone={isSelected ? 'brand' : 'none'}
      className="p-0 overflow-hidden group transition-all duration-300"
      interactive
      onClick={() => onSelect(question.id)}
      selected={isSelected}
      variant={isSelected ? 'elevated' : 'subtle'}
    >
      <div className="flex flex-col sm:flex-row items-stretch">
        {/* Visual Indicator/Icon Area */}
        <div className={[
          'flex sm:w-16 items-center justify-center p-4 sm:p-0 border-b sm:border-b-0 sm:border-r border-line/40 transition-colors relative',
          isSelected ? 'bg-brand/5 text-brand' : 'bg-surface-alt/40 text-muted group-hover:bg-brand/5 group-hover:text-brand'
        ].join(' ')}>
          {isBulkMode ? (
             <input 
              type="checkbox" 
              checked={isItemSelected}
              onChange={(e) => { e.stopPropagation(); onToggleSelection?.(question.id); }}
              className="size-5 rounded border-line text-brand focus:ring-brand cursor-pointer"
             />
          ) : (
             <TypeIcon className="size-6" />
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info" variant="solid" className="font-mono text-[10px]">#{question.code}</Badge>
            <Badge
              tone={normalizeStatus(question.status) === 'Archived' ? 'neutral' : 'success'}
              variant="soft"
              className="text-[10px] uppercase tracking-wider"
            >
              {question.status}
            </Badge>
            <span className="text-[10px] font-bold text-muted uppercase">Phiên bản {question.currentVersionNumber}</span>
          </div>

          <h3 className="text-lg font-bold text-ink line-clamp-2 group-hover:text-brand transition-colors leading-relaxed">
            <LatexRenderer text={stemText || 'Câu hỏi chưa có nội dung'} />
          </h3>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted">
            <div className="flex items-center gap-1.5">
              <SignalMedium className="size-3.5 text-brand-strong/60" />
              {currentVersion?.difficulty || 'N/A'}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-brand-strong/60" />
              {currentVersion?.estimatedSeconds || 0}s
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="size-3.5 text-brand-strong/60" />
              {question.tags.length} thẻ
            </div>
          </div>

          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {question.tags.slice(0, 3).map(tag => (
                <Badge key={tag} tone="primary" variant="outline" className="text-[9px] py-0 h-4 border-primary/20">
                  {tag}
                </Badge>
              ))}
              {question.tags.length > 3 && (
                <span className="text-[9px] text-muted font-bold">+{question.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Actions Area */}
        <div className="flex sm:flex-col items-center justify-center p-4 sm:p-5 gap-3 sm:border-l border-line/40 bg-surface-alt/10">
          <Button
            onClick={(e) => { e.stopPropagation(); onPreview(question.id); }}
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Xem
          </Button>

          <DropdownMenu align="end">
            <DropdownMenuTrigger
              aria-label={`Thêm thao tác cho ${question.code}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition hover:bg-brand-soft/60 hover:border-brand/30"
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(question); }}>
                <Pencil className="size-4 text-brand-strong" />
                Chỉnh sửa
              </DropdownMenuItem>
              {normalizeStatus(question.status) === 'Archived' ? (
                <>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onRestore(question.id); }}
                  >
                    <RotateCcw className="size-4 text-brand-strong" />
                    Khôi phục
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-danger"
                    onClick={(e) => { e.stopPropagation(); onDeletePermanently(question.id); }}
                  >
                    <Trash2 className="size-4" />
                    Xóa
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onArchive(question.id); }}
                  >
                    <Archive className="size-4 text-brand-strong" />
                    Lưu trữ
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-danger"
                    onClick={(e) => { e.stopPropagation(); onDeletePermanently(question.id); }}
                  >
                    <Trash2 className="size-4" />
                    Xóa
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </CardShell>
  )
}
