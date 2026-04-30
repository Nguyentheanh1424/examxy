import type { FormEvent, ReactNode } from 'react'
import {
  BookOpenText,
  FileText,
  PlusCircle,
  RefreshCcw,
  Search,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { EmptyState } from '@/components/ui/empty-state'
import { Notice } from '@/components/ui/notice'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import {
  createQuestionRequest,
  deleteQuestionRequest,
  getQuestionsRequest,
  updateQuestionRequest,
} from '@/features/question-bank/lib/question-bank-api'
import { getErrorMessage } from '@/lib/http/api-error'
import type {
  CreateQuestionRequest,
  Question,
  QuestionVersion,
  UpdateQuestionRequest,
} from '@/types/question-bank'

type StatusTab = 'Active' | 'Archived' | 'All'

interface QuestionDraftState {
  stem: string
  questionType: string
  explanation: string
  difficulty: string
  estimatedSeconds: string
  contentJson: string
  answerKeyJson: string
  tags: string
}

const emptyDraft: QuestionDraftState = {
  stem: '',
  questionType: 'SingleChoice',
  explanation: '',
  difficulty: 'Medium',
  estimatedSeconds: '60',
  contentJson: '{"choices":["A","B"]}',
  answerKeyJson: '"A"',
  tags: '',
}

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toCreateRequest(state: QuestionDraftState): CreateQuestionRequest {
  return {
    stemPlainText: state.stem.trim(),
    stemRichText: `<p>${state.stem.trim()}</p>`,
    questionType: state.questionType.trim(),
    explanationRichText: `<p>${state.explanation.trim()}</p>`,
    difficulty: state.difficulty.trim(),
    estimatedSeconds: Number(state.estimatedSeconds) || 60,
    contentJson: state.contentJson,
    answerKeyJson: state.answerKeyJson,
    tags: state.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    attachments: [],
  }
}

function toUpdateRequest(question: Question, state: QuestionDraftState): UpdateQuestionRequest {
  return {
    ...toCreateRequest(state),
    status: question.status,
  }
}

function getCurrentVersion(question: Question): QuestionVersion | undefined {
  return question.versions.find(
    (version) => version.versionNumber === question.currentVersionNumber,
  ) ?? question.versions[0]
}

function stripParagraphTags(value: string) {
  return value.replace(/<\/?p>/g, '')
}

function toDraftState(question: Question): QuestionDraftState {
  const currentVersion = getCurrentVersion(question)

  return {
    stem: currentVersion?.stemPlainText ?? '',
    questionType: currentVersion?.questionType ?? 'SingleChoice',
    explanation: currentVersion?.explanationRichText
      ? stripParagraphTags(currentVersion.explanationRichText)
      : '',
    difficulty: currentVersion?.difficulty ?? 'Medium',
    estimatedSeconds: String(currentVersion?.estimatedSeconds ?? 60),
    contentJson: currentVersion?.contentJson ?? '{}',
    answerKeyJson: currentVersion?.answerKeyJson ?? '{}',
    tags: question.tags.join(', '),
  }
}

function normalizeStatus(value: string): Exclude<StatusTab, 'All'> {
  return value.toLowerCase() === 'archived' ? 'Archived' : 'Active'
}

function safeParseJson(value: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) }
  } catch {
    return { ok: false }
  }
}

function stringifyPreview(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function questionMatchesQuery(question: Question, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const currentVersion = getCurrentVersion(question)
  const haystack = [
    question.code,
    question.status,
    ...question.tags,
    currentVersion?.stemPlainText,
    currentVersion?.questionType,
    currentVersion?.difficulty,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

function JsonPreview({ label, value }: { label: string; value: string }) {
  const parsed = safeParseJson(value)

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-[var(--radius-input)] border border-line bg-surface p-4 text-sm leading-6 text-ink">
        {parsed.ok ? stringifyPreview(parsed.value) : value}
      </pre>
      {!parsed.ok ? (
        <p className="text-sm font-medium text-danger">
          Invalid JSON. Showing the saved raw value.
        </p>
      ) : null}
    </div>
  )
}

function FilterChip({
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

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [draft, setDraft] = useState<QuestionDraftState>(emptyDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<QuestionDraftState>(emptyDraft)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [statusTab, setStatusTab] = useState<StatusTab>('Active')
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; title: string; message: string } | null>(null)

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    questions.forEach((question) => {
      question.tags.forEach((tag) => tags.add(tag))
    })

    return Array.from(tags).sort((a, b) => a.localeCompare(b))
  }, [questions])

  const counts = useMemo(() => ({
    Active: questions.filter((question) => normalizeStatus(question.status) === 'Active').length,
    Archived: questions.filter((question) => normalizeStatus(question.status) === 'Archived').length,
    All: questions.length,
  }), [questions])

  const filteredQuestions = useMemo(() => (
    questions.filter((question) => {
      if (statusTab !== 'All' && normalizeStatus(question.status) !== statusTab) {
        return false
      }

      if (selectedTags.length > 0 && !selectedTags.every((tag) => question.tags.includes(tag))) {
        return false
      }

      return questionMatchesQuery(question, query)
    })
  ), [query, questions, selectedTags, statusTab])

  const selectedQuestion = selectedQuestionId
    ? questions.find((question) => question.id === selectedQuestionId) ?? null
    : null

  async function loadQuestions() {
    const response = await getQuestionsRequest()
    setQuestions(response)
  }

  function beginEdit(question: Question) {
    setSelectedQuestionId(question.id)
    setEditId(question.id)
    setEditDraft(toDraftState(question))
  }

  function resetFilters() {
    setStatusTab('Active')
    setQuery('')
    setSelectedTags([])
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) => (
      current.includes(tag)
        ? current.filter((candidate) => candidate !== tag)
        : [...current, tag]
    ))
  }

  useEffect(() => {
    void (async () => {
      setError(null)

      try {
        await loadQuestions()
      } catch (nextError) {
        setError(getErrorMessage(nextError, 'Unable to load the question bank.'))
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyKey('create-question')
    setNotice(null)

    try {
      await createQuestionRequest(toCreateRequest(draft))
      setDraft(emptyDraft)
      await loadQuestions()
      setNotice({
        tone: 'success',
        title: 'Question created',
        message: 'The new question is now available for assessments.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to create question',
        message: getErrorMessage(nextError, 'Check the question payload and try again.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editId) return

    const question = questions.find((candidate) => candidate.id === editId)
    if (!question) return

    setBusyKey(`update-${editId}`)
    setNotice(null)

    try {
      await updateQuestionRequest(editId, toUpdateRequest(question, editDraft))
      setEditId(null)
      await loadQuestions()
      setNotice({
        tone: 'success',
        title: 'Question updated',
        message: 'A new version has been appended to the question history.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to update question',
        message: getErrorMessage(nextError, 'The question could not be updated.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDelete(questionId: string) {
    setBusyKey(`delete-${questionId}`)
    setNotice(null)

    try {
      await deleteQuestionRequest(questionId)
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null)
      }
      if (editId === questionId) {
        setEditId(null)
      }
      await loadQuestions()
      setNotice({
        tone: 'success',
        title: 'Question archived',
        message: 'The question has been removed from the active bank.',
      })
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Unable to delete question',
        message: getErrorMessage(nextError, 'The question could not be deleted.'),
      })
    } finally {
      setBusyKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardShell className="p-6 sm:p-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 max-w-2xl" />
          </div>
        </CardShell>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <CardShell className="p-5" key={index}>
                <Skeleton className="mb-3 h-4 w-28" />
                <Skeleton className="mb-3 h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardShell>
            ))}
          </div>
          <CardShell className="hidden p-5 lg:block">
            <Skeleton className="mb-4 h-6 w-40" />
            <Skeleton className="mb-3 h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardShell>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Teacher tooling
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
                Question bank
              </h1>
              <p className="max-w-3xl text-base leading-7 text-muted">
                Build reusable questions with version history, tags, and JSON payloads
                that can be snapped into class assessments.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/teacher/dashboard">
              <Button variant="secondary">Back to dashboard</Button>
            </Link>
            <Button
              leftIcon={<RefreshCcw className="size-4" />}
              onClick={() => { void loadQuestions() }}
              variant="secondary"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardShell>

      {notice ? (
        <Notice tone={notice.tone} title={notice.title}>
          {notice.message}
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="Unable to load question bank">
          {error}
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-6">
          <CardShell className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <Tabs
                  className="space-y-0"
                  onValueChange={(value) => setStatusTab(value as StatusTab)}
                  value={statusTab}
                >
                  <TabsList>
                    {(['Active', 'Archived', 'All'] as const).map((tab) => (
                      <TabsTrigger key={tab} value={tab}>
                        {tab} <span className="ml-2 font-mono text-xs">{counts[tab]}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="min-w-0 flex-1 lg:max-w-sm">
                  <TextField
                    label="Search questions"
                    leftIcon={<Search className="size-4" />}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search stem, code, type, difficulty, or tags"
                    value={query}
                  />
                </div>
              </div>

              {allTags.length > 0 ? (
                <div className="space-y-2 border-t border-line pt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted">
                    <Tags className="size-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <FilterChip
                        active={selectedTags.includes(tag)}
                        key={tag}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </FilterChip>
                    ))}
                    {query || selectedTags.length > 0 || statusTab !== 'Active' ? (
                      <Button
                        leftIcon={<X className="size-4" />}
                        onClick={resetFilters}
                        type="button"
                        variant="ghost"
                      >
                        Reset filters
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </CardShell>

          {questions.length === 0 ? (
            <EmptyState
              action={{
                label: 'Create question below',
                onClick: () => {
                  document.getElementById('create-question-form')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                },
                leftIcon: <PlusCircle className="size-4" />,
              }}
              description="Create your first reusable question, then add tags and JSON answer data for assessment authoring."
              title="No question-bank items yet"
              variant="no-data"
            />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState
              action={{
                label: 'Reset filters',
                onClick: resetFilters,
                leftIcon: <RefreshCcw className="size-4" />,
              }}
              description="Try a different search term, status, or tag filter."
              title="No matching questions"
              variant="no-results"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-medium text-muted">
                  Showing <span className="font-mono text-ink">{filteredQuestions.length}</span> of{' '}
                  <span className="font-mono text-ink">{questions.length}</span> questions
                </p>
              </div>

              {filteredQuestions.map((question) => {
                const currentVersion = getCurrentVersion(question)
                const isSelected = question.id === selectedQuestionId

                return (
                  <CardShell
                    className={[
                      'p-5 transition',
                      isSelected ? 'border-brand ring-4 ring-focus/25' : 'hover:border-brand/30',
                    ].join(' ')}
                    key={question.id}
                  >
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="primary" variant="soft">{question.code}</Badge>
                            <Badge
                              tone={normalizeStatus(question.status) === 'Archived' ? 'neutral' : 'success'}
                              variant="soft"
                            >
                              {question.status}
                            </Badge>
                            <Badge tone="info" variant="outline">
                              {currentVersion?.questionType ?? 'Unknown type'}
                            </Badge>
                          </div>
                          <h2 className="text-xl font-semibold leading-snug text-ink">
                            {currentVersion?.stemPlainText || 'Untitled question'}
                          </h2>
                          <p className="text-sm leading-6 text-muted">
                            Updated {formatUtcDate(question.updatedAtUtc)} - Version {question.currentVersionNumber}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => setSelectedQuestionId(question.id)}
                            type="button"
                            variant="secondary"
                          >
                            Preview
                          </Button>
                          <Button
                            leftIcon={<BookOpenText className="size-4" />}
                            onClick={() => beginEdit(question)}
                            type="button"
                            variant="secondary"
                          >
                            Edit
                          </Button>
                          <Button
                            isLoading={busyKey === `delete-${question.id}`}
                            leftIcon={<Trash2 className="size-4" />}
                            onClick={() => { void handleDelete(question.id) }}
                            type="button"
                            variant="danger"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {question.tags.length > 0 ? (
                          question.tags.map((tag) => (
                            <span
                              className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted"
                              key={tag}
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full border border-dashed border-line px-3 py-1 text-xs font-semibold text-muted">
                            No tags
                          </span>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <MetaTile label="Difficulty" value={currentVersion?.difficulty ?? 'N/A'} />
                        <MetaTile label="Estimated time" value={`${currentVersion?.estimatedSeconds ?? 0}s`} />
                        <MetaTile label="Attachments" value={String(currentVersion?.attachments.length ?? 0)} />
                      </div>
                    </div>
                  </CardShell>
                )
              })}
            </div>
          )}

          <QuestionFormCard
            busyKey={busyKey}
            draft={draft}
            formId="create-question-form"
            heading="Add a reusable item"
            onDraftChange={setDraft}
            onSubmit={handleCreate}
            submitLabel="Create question"
            title="Create question"
          />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          {selectedQuestion ? (
            <QuestionPreviewPanel
              busyKey={busyKey}
              editDraft={editDraft}
              editId={editId}
              onCancelEdit={() => setEditId(null)}
              onDelete={(questionId) => { void handleDelete(questionId) }}
              onEdit={beginEdit}
              onEditDraftChange={setEditDraft}
              onSubmitEdit={handleUpdate}
              question={selectedQuestion}
            />
          ) : (
            <CardShell className="p-6">
              <div className="space-y-3">
                <div className="flex size-12 items-center justify-center rounded-[var(--radius-input)] bg-brand-soft text-brand-strong">
                  <BookOpenText className="size-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                    Select a question
                  </h2>
                  <p className="text-base leading-7 text-muted">
                    Choose an item from the list to inspect its current version,
                    tags, attachments, and JSON payloads.
                  </p>
                </div>
              </div>
            </CardShell>
          )}
        </aside>
      </div>
    </div>
  )
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-input)] border border-line bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function QuestionFormCard({
  busyKey,
  draft,
  formId,
  heading,
  onDraftChange,
  onSubmit,
  submitLabel,
  title,
}: {
  busyKey: string | null
  draft: QuestionDraftState
  formId?: string
  heading: string
  onDraftChange: (next: QuestionDraftState | ((current: QuestionDraftState) => QuestionDraftState)) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: string
  title: string
}) {
  return (
    <CardShell className="p-6 sm:p-8">
      <form aria-label={title} className="space-y-5" id={formId} onSubmit={onSubmit}>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
            {title}
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            {heading}
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Question type"
            onChange={(event) => onDraftChange((current) => ({ ...current, questionType: event.target.value }))}
            value={draft.questionType}
          />
          <TextField
            label="Difficulty"
            onChange={(event) => onDraftChange((current) => ({ ...current, difficulty: event.target.value }))}
            value={draft.difficulty}
          />
          <TextField
            label="Estimated seconds"
            onChange={(event) => onDraftChange((current) => ({ ...current, estimatedSeconds: event.target.value }))}
            type="number"
            value={draft.estimatedSeconds}
          />
          <TextField
            label="Tags (comma separated)"
            onChange={(event) => onDraftChange((current) => ({ ...current, tags: event.target.value }))}
            value={draft.tags}
          />
        </div>

        <TextareaField
          label="Stem"
          onChange={(event) => onDraftChange((current) => ({ ...current, stem: event.target.value }))}
          rows={3}
          value={draft.stem}
        />
        <TextareaField
          label="Explanation"
          onChange={(event) => onDraftChange((current) => ({ ...current, explanation: event.target.value }))}
          rows={3}
          value={draft.explanation}
        />
        <TextareaField
          label="Content JSON"
          onChange={(event) => onDraftChange((current) => ({ ...current, contentJson: event.target.value }))}
          rows={5}
          value={draft.contentJson}
        />
        <TextareaField
          label="Answer key JSON"
          onChange={(event) => onDraftChange((current) => ({ ...current, answerKeyJson: event.target.value }))}
          rows={3}
          value={draft.answerKeyJson}
        />

        <Button
          isLoading={busyKey === 'create-question' || busyKey?.startsWith('update-')}
          leftIcon={<PlusCircle className="size-4" />}
          type="submit"
        >
          {submitLabel}
        </Button>
      </form>
    </CardShell>
  )
}

function QuestionPreviewPanel({
  busyKey,
  editDraft,
  editId,
  onCancelEdit,
  onDelete,
  onEdit,
  onEditDraftChange,
  onSubmitEdit,
  question,
}: {
  busyKey: string | null
  editDraft: QuestionDraftState
  editId: string | null
  onCancelEdit: () => void
  onDelete: (questionId: string) => void
  onEdit: (question: Question) => void
  onEditDraftChange: (next: QuestionDraftState | ((current: QuestionDraftState) => QuestionDraftState)) => void
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void
  question: Question
}) {
  const currentVersion = getCurrentVersion(question)
  const isEditing = editId === question.id

  return (
    <CardShell className="overflow-hidden">
      <div className="space-y-5 border-b border-line bg-panel p-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary" variant="soft">{question.code}</Badge>
          <Badge tone={normalizeStatus(question.status) === 'Archived' ? 'neutral' : 'success'} variant="soft">
            {question.status}
          </Badge>
          <Badge tone="info" variant="outline">
            Version {question.currentVersionNumber}
          </Badge>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            {currentVersion?.stemPlainText || 'Untitled question'}
          </h2>
          <p className="text-sm leading-6 text-muted">
            Updated {formatUtcDate(question.updatedAtUtc)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            leftIcon={<BookOpenText className="size-4" />}
            onClick={() => onEdit(question)}
            type="button"
            variant="secondary"
          >
            Edit question
          </Button>
          <Button
            isLoading={busyKey === `delete-${question.id}`}
            leftIcon={<Trash2 className="size-4" />}
            onClick={() => onDelete(question.id)}
            type="button"
            variant="danger"
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {currentVersion ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetaTile label="Type" value={currentVersion.questionType} />
              <MetaTile label="Difficulty" value={currentVersion.difficulty} />
              <MetaTile label="Estimated time" value={`${currentVersion.estimatedSeconds}s`} />
              <MetaTile label="Attachments" value={String(currentVersion.attachments.length)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Tags</p>
              <div className="flex flex-wrap gap-2">
                {question.tags.length > 0 ? (
                  question.tags.map((tag) => (
                    <Badge key={tag} tone="neutral" variant="outline">{tag}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted">No tags</span>
                )}
              </div>
            </div>

            {currentVersion.explanationRichText ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">Explanation</p>
                <p className="rounded-[var(--radius-input)] border border-line bg-surface p-4 text-sm leading-6 text-muted">
                  {stripParagraphTags(currentVersion.explanationRichText)}
                </p>
              </div>
            ) : null}

            {currentVersion.attachments.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">Attachments</p>
                <div className="space-y-2">
                  {currentVersion.attachments.map((attachment) => (
                    <div
                      className="flex items-center gap-3 rounded-[var(--radius-input)] border border-line bg-surface p-3"
                      key={attachment.id}
                    >
                      <FileText className="size-4 shrink-0 text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{attachment.fileName}</p>
                        <p className="text-xs text-muted">
                          {attachment.contentType} - {attachment.fileSizeBytes} bytes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <JsonPreview label="Content JSON" value={currentVersion.contentJson} />
            <JsonPreview label="Answer key JSON" value={currentVersion.answerKeyJson} />
          </>
        ) : (
          <Notice tone="warning" title="Missing version data">
            This question does not include a readable current version.
          </Notice>
        )}

        {isEditing ? (
          <div className="space-y-4 border-t border-line pt-6">
            <QuestionFormCard
              busyKey={busyKey}
              draft={editDraft}
              heading="Save a new version while preserving status"
              onDraftChange={onEditDraftChange}
              onSubmit={onSubmitEdit}
              submitLabel="Save new version"
              title="Edit current question"
            />
            <Button onClick={onCancelEdit} type="button" variant="secondary">
              Cancel edit
            </Button>
          </div>
        ) : null}
      </div>
    </CardShell>
  )
}
