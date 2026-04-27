import type { FormEvent } from 'react'
import { Archive, BookOpenText, PlusCircle, RefreshCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
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
  UpdateQuestionRequest,
} from '@/types/question-bank'

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

export function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [draft, setDraft] = useState<QuestionDraftState>(emptyDraft)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<QuestionDraftState>(emptyDraft)
  const [isLoading, setIsLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; title: string; message: string } | null>(null)

  async function loadQuestions() {
    const response = await getQuestionsRequest()
    setQuestions(response)
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading question bank...
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

      <CardShell className="p-6 sm:p-8">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">
              Create question
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
              Add a reusable item
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TextField
              label="Question type"
              onChange={(event) => setDraft((current) => ({ ...current, questionType: event.target.value }))}
              value={draft.questionType}
            />
            <TextField
              label="Difficulty"
              onChange={(event) => setDraft((current) => ({ ...current, difficulty: event.target.value }))}
              value={draft.difficulty}
            />
            <TextField
              label="Estimated seconds"
              onChange={(event) => setDraft((current) => ({ ...current, estimatedSeconds: event.target.value }))}
              type="number"
              value={draft.estimatedSeconds}
            />
            <TextField
              label="Tags (comma separated)"
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              value={draft.tags}
            />
          </div>

          <TextareaField
            label="Stem"
            onChange={(event) => setDraft((current) => ({ ...current, stem: event.target.value }))}
            rows={3}
            value={draft.stem}
          />
          <TextareaField
            label="Explanation"
            onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
            rows={3}
            value={draft.explanation}
          />
          <TextareaField
            label="Content JSON"
            onChange={(event) => setDraft((current) => ({ ...current, contentJson: event.target.value }))}
            rows={5}
            value={draft.contentJson}
          />
          <TextareaField
            label="Answer key JSON"
            onChange={(event) => setDraft((current) => ({ ...current, answerKeyJson: event.target.value }))}
            rows={3}
            value={draft.answerKeyJson}
          />

          <Button
            isLoading={busyKey === 'create-question'}
            leftIcon={<PlusCircle className="size-4" />}
            type="submit"
          >
            Create question
          </Button>
        </form>
      </CardShell>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <CardShell className="p-6 sm:p-8">
            <p className="text-base leading-7 text-muted">
              No question-bank items exist yet.
            </p>
          </CardShell>
        ) : null}

        {questions.map((question) => {
          const currentVersion = question.versions.find(
            (version) => version.versionNumber === question.currentVersionNumber,
          ) ?? question.versions[0]

          return (
            <CardShell className="p-6" key={question.id}>
              <div className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-strong">
                        {question.code}
                      </span>
                      <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">
                        {question.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-ink">
                      {currentVersion?.stemPlainText || 'Untitled question'}
                    </h2>
                    <p className="text-sm leading-6 text-muted">
                      Updated {formatUtcDate(question.updatedAtUtc)} • Version {question.currentVersionNumber}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      leftIcon={<BookOpenText className="size-4" />}
                      onClick={() => {
                        setEditId(question.id)
                        setEditDraft({
                          stem: currentVersion?.stemPlainText ?? '',
                          questionType: currentVersion?.questionType ?? 'SingleChoice',
                          explanation: currentVersion?.explanationRichText.replace(/<\/?p>/g, '') ?? '',
                          difficulty: currentVersion?.difficulty ?? 'Medium',
                          estimatedSeconds: String(currentVersion?.estimatedSeconds ?? 60),
                          contentJson: currentVersion?.contentJson ?? '{}',
                          answerKeyJson: currentVersion?.answerKeyJson ?? '{}',
                          tags: question.tags.join(', '),
                        })
                      }}
                      variant="secondary"
                    >
                      Edit
                    </Button>
                    <Button
                      isLoading={busyKey === `delete-${question.id}`}
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => { void handleDelete(question.id) }}
                      variant="danger"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <span
                      className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                  {question.tags.length === 0 ? (
                    <span className="rounded-full border border-dashed border-line px-3 py-1 text-xs font-semibold text-muted">
                      No tags
                    </span>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-line bg-surface p-4">
                  <p className="text-sm font-semibold text-ink">Current version</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Type {currentVersion?.questionType} • Difficulty {currentVersion?.difficulty} • Estimated {currentVersion?.estimatedSeconds}s
                  </p>
                </div>

                {editId === question.id ? (
                  <form className="space-y-4 rounded-3xl border border-line bg-panel p-4" onSubmit={handleUpdate}>
                    <div className="flex items-center gap-2">
                      <Archive className="size-4 text-brand-strong" />
                      <p className="text-sm font-semibold text-ink">Edit current question</p>
                    </div>

                    <TextField
                      label="Question type"
                      onChange={(event) => setEditDraft((current) => ({ ...current, questionType: event.target.value }))}
                      value={editDraft.questionType}
                    />
                    <TextField
                      label="Difficulty"
                      onChange={(event) => setEditDraft((current) => ({ ...current, difficulty: event.target.value }))}
                      value={editDraft.difficulty}
                    />
                    <TextField
                      label="Estimated seconds"
                      onChange={(event) => setEditDraft((current) => ({ ...current, estimatedSeconds: event.target.value }))}
                      type="number"
                      value={editDraft.estimatedSeconds}
                    />
                    <TextField
                      label="Tags"
                      onChange={(event) => setEditDraft((current) => ({ ...current, tags: event.target.value }))}
                      value={editDraft.tags}
                    />
                    <TextareaField
                      label="Stem"
                      onChange={(event) => setEditDraft((current) => ({ ...current, stem: event.target.value }))}
                      rows={3}
                      value={editDraft.stem}
                    />
                    <TextareaField
                      label="Explanation"
                      onChange={(event) => setEditDraft((current) => ({ ...current, explanation: event.target.value }))}
                      rows={3}
                      value={editDraft.explanation}
                    />
                    <TextareaField
                      label="Content JSON"
                      onChange={(event) => setEditDraft((current) => ({ ...current, contentJson: event.target.value }))}
                      rows={5}
                      value={editDraft.contentJson}
                    />
                    <TextareaField
                      label="Answer key JSON"
                      onChange={(event) => setEditDraft((current) => ({ ...current, answerKeyJson: event.target.value }))}
                      rows={3}
                      value={editDraft.answerKeyJson}
                    />

                    <div className="flex flex-wrap gap-3">
                      <Button
                        isLoading={busyKey === `update-${question.id}`}
                        type="submit"
                      >
                        Save new version
                      </Button>
                      <Button
                        onClick={() => setEditId(null)}
                        type="button"
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            </CardShell>
          )
        })}
      </div>
    </div>
  )
}
