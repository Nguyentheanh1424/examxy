import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { CardShell } from '@/components/ui/card-shell'
import { CheckboxField } from '@/components/ui/checkbox-field'
import { Notice } from '@/components/ui/notice'
import { Spinner } from '@/components/ui/spinner'
import { TextField } from '@/components/ui/text-field'
import { TextareaField } from '@/components/ui/textarea-field'
import { useAuth } from '@/features/auth/auth-context'
import {
  createClassCommentRequest,
  createClassPostRequest,
  createClassScheduleItemRequest,
  getClassDashboardRequest,
  getClassFeedRequest,
  getClassMentionCandidatesRequest,
  getClassScheduleItemsRequest,
  hideClassCommentRequest,
  setCommentReactionRequest,
  setPostReactionRequest,
  updateClassCommentRequest,
  updateClassPostRequest,
  updateClassScheduleItemRequest,
} from '@/features/class-content/lib/class-content-api'
import {
  realtimeEventTypes,
  realtimeScopeTypes,
} from '@/features/realtime/lib/realtime-event-types'
import type { RealtimeEventEnvelope } from '@/features/realtime/types/realtime'
import { useRealtime } from '@/features/realtime/use-realtime'
import { MentionCandidatePicker } from '@/features/mentions/components/mention-candidate-picker'
import { getErrorMessage } from '@/lib/http/api-error'
import { cn } from '@/lib/utils/cn'
import type {
  ClassDashboard,
  ClassFeedItem,
  ClassMentionCandidate,
  ClassMentionSummary,
  ClassScheduleItem,
  CreateClassCommentRequest,
  CreateClassPostRequest,
  CreateClassScheduleItemRequest,
  UpdateClassCommentRequest,
  UpdateClassPostRequest,
  UpdateClassScheduleItemRequest,
} from '@/types/class-content'

const reactionTypes = ['Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'] as const

interface PostDraft {
  title: string
  content: string
  allowComments: boolean
  isPinned: boolean
  notifyAll: boolean
  taggedUserIds: string[]
}

interface CommentDraft {
  content: string
  notifyAll: boolean
  taggedUserIds: string[]
}

interface ScheduleDraft {
  type: string
  title: string
  description: string
  startAt: string
  endAt: string
  timezoneId: string
  isAllDay: boolean
}

const emptyPostDraft: PostDraft = {
  title: '',
  content: '',
  allowComments: true,
  isPinned: false,
  notifyAll: false,
  taggedUserIds: [],
}

const emptyCommentDraft: CommentDraft = {
  content: '',
  notifyAll: false,
  taggedUserIds: [],
}

const emptyScheduleDraft: ScheduleDraft = {
  type: 'Event',
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  timezoneId: '',
  isAllDay: false,
}

function formatUtcDate(value: string | null) {
  if (!value) return 'N/A'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function toUtc(value: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toLocalInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toCreatePostRequest(draft: PostDraft): CreateClassPostRequest {
  const text = draft.content.trim()
  return {
    type: 'Post',
    title: draft.title.trim(),
    contentPlainText: text,
    contentRichText: text,
    allowComments: draft.allowComments,
    isPinned: draft.isPinned,
    notifyAll: draft.notifyAll,
    publishAtUtc: null,
    closeAtUtc: null,
    taggedUserIds: draft.taggedUserIds,
    attachments: [],
  }
}

function toUpdatePostRequest(draft: PostDraft, post: ClassFeedItem): UpdateClassPostRequest {
  const text = draft.content.trim()
  return {
    title: draft.title.trim(),
    contentPlainText: text,
    contentRichText: text,
    allowComments: draft.allowComments,
    isPinned: draft.isPinned,
    notifyAll: draft.notifyAll,
    publishAtUtc: post.publishAtUtc,
    closeAtUtc: post.closeAtUtc,
    status: post.status,
    taggedUserIds: draft.taggedUserIds,
  }
}

function toCreateCommentRequest(draft: CommentDraft): CreateClassCommentRequest {
  const text = draft.content.trim()
  return {
    contentPlainText: text,
    contentRichText: text,
    notifyAll: draft.notifyAll,
    taggedUserIds: draft.taggedUserIds,
  }
}

function toUpdateCommentRequest(draft: CommentDraft): UpdateClassCommentRequest {
  const text = draft.content.trim()
  return {
    contentPlainText: text,
    contentRichText: text,
    notifyAll: draft.notifyAll,
    taggedUserIds: draft.taggedUserIds,
  }
}

function toScheduleRequest(draft: ScheduleDraft): CreateClassScheduleItemRequest {
  const text = draft.description.trim()
  return {
    type: draft.type,
    title: draft.title.trim(),
    descriptionPlainText: text,
    descriptionRichText: text,
    startAtUtc: toUtc(draft.startAt) ?? new Date().toISOString(),
    endAtUtc: toUtc(draft.endAt),
    timezoneId: draft.timezoneId.trim(),
    isAllDay: draft.isAllDay,
    relatedPostId: null,
    relatedAssessmentId: null,
  }
}

function toScheduleUpdateRequest(draft: ScheduleDraft): UpdateClassScheduleItemRequest {
  const text = draft.description.trim()
  return {
    type: draft.type,
    title: draft.title.trim(),
    descriptionPlainText: text,
    descriptionRichText: text,
    startAtUtc: toUtc(draft.startAt) ?? new Date().toISOString(),
    endAtUtc: toUtc(draft.endAt),
    timezoneId: draft.timezoneId.trim(),
    isAllDay: draft.isAllDay,
    relatedPostId: null,
    relatedAssessmentId: null,
  }
}

function renderMentionSummary(
  mentions: ClassMentionSummary,
  mentionCandidateByUserId: Map<string, ClassMentionCandidate>,
) {
  const hasMentions = mentions.notifyAll || mentions.taggedUserIds.length > 0
  if (!hasMentions) {
    return null
  }

  const taggedLabels = mentions.taggedUserIds.map((taggedUserId, index) => {
    const candidate = mentionCandidateByUserId.get(taggedUserId)
    return {
      key: `${taggedUserId}-${index}`,
      label: candidate ? `@${candidate.displayName}` : `@${taggedUserId}`,
    }
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mentions.notifyAll ? (
        <span className="rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
          Notify all
        </span>
      ) : null}
      {taggedLabels.map((item) => (
        <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-muted" key={item.key}>
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function ClassDashboardPage() {
  const { classId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const { addEventListener, subscribeClass, unsubscribeClass } = useRealtime()

  const [dashboard, setDashboard] = useState<ClassDashboard | null>(null)
  const [feedItems, setFeedItems] = useState<ClassFeedItem[]>([])
  const [scheduleItems, setScheduleItems] = useState<ClassScheduleItem[]>([])
  const [mentionCandidates, setMentionCandidates] = useState<ClassMentionCandidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [postCreateDraft, setPostCreateDraft] = useState<PostDraft>(emptyPostDraft)
  const [postEditId, setPostEditId] = useState<string | null>(null)
  const [postEditDraft, setPostEditDraft] = useState<PostDraft>(emptyPostDraft)
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<string, CommentDraft>>({})
  const [commentEditId, setCommentEditId] = useState<string | null>(null)
  const [commentEditDraft, setCommentEditDraft] = useState<CommentDraft>(emptyCommentDraft)
  const [scheduleCreateDraft, setScheduleCreateDraft] = useState<ScheduleDraft>(emptyScheduleDraft)
  const [scheduleEditId, setScheduleEditId] = useState<string | null>(null)
  const [scheduleEditDraft, setScheduleEditDraft] = useState<ScheduleDraft>(emptyScheduleDraft)
  const [highlightedScheduleItemId, setHighlightedScheduleItemId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; title: string; message: string } | null>(null)
  const realtimeRefreshTimeoutRef = useRef<number | null>(null)
  const scheduleHighlightTimeoutRef = useRef<number | null>(null)
  const scheduleItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const handledScheduleTargetRef = useRef<string | null>(null)
  const refreshDataRef = useRef<(showLoader: boolean) => Promise<void>>(async () => undefined)
  const selectedScheduleItemId = searchParams.get('scheduleItemId')

  const isTeacherOwner = useMemo(
    () => Boolean(session?.primaryRole === 'Teacher' && dashboard?.isTeacherOwner),
    [dashboard?.isTeacherOwner, session?.primaryRole],
  )
  const canComment = Boolean(isTeacherOwner || session?.primaryRole === 'Student')
  const mentionCandidateByUserId = useMemo(
    () =>
      new Map(
        mentionCandidates.map((candidate) => [candidate.userId, candidate] as const),
      ),
    [mentionCandidates],
  )

  async function loadData() {
    const [dashboardResponse, feedResponse, scheduleResponse, mentionResponse] = await Promise.all([
      getClassDashboardRequest(classId),
      getClassFeedRequest(classId),
      getClassScheduleItemsRequest(classId),
      getClassMentionCandidatesRequest(classId),
    ])
    setDashboard(dashboardResponse)
    setFeedItems(feedResponse)
    setScheduleItems(scheduleResponse)
    setMentionCandidates(mentionResponse)
    setScheduleCreateDraft((current) => ({ ...current, timezoneId: dashboardResponse.timezoneId }))
  }

  async function refreshData(showLoader: boolean) {
    if (showLoader) setIsLoading(true)
    setError(null)
    try {
      await loadData()
    } catch (nextError) {
      setError(getErrorMessage(nextError, 'Unable to load class dashboard.'))
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }

  refreshDataRef.current = refreshData

  useEffect(() => {
    if (!classId) {
      setError('Missing class id in route.')
      setIsLoading(false)
      return
    }
    void refreshData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current)
        realtimeRefreshTimeoutRef.current = null
      }

      if (scheduleHighlightTimeoutRef.current !== null) {
        window.clearTimeout(scheduleHighlightTimeoutRef.current)
        scheduleHighlightTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedScheduleItemId) {
      handledScheduleTargetRef.current = null
      setHighlightedScheduleItemId(null)
      return
    }

    if (handledScheduleTargetRef.current === selectedScheduleItemId) {
      return
    }

    const node = scheduleItemRefs.current[selectedScheduleItemId]
    if (!node || !scheduleItems.some((item) => item.id === selectedScheduleItemId)) {
      return
    }

    handledScheduleTargetRef.current = selectedScheduleItemId
    setHighlightedScheduleItemId(selectedScheduleItemId)
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if (scheduleHighlightTimeoutRef.current !== null) {
      window.clearTimeout(scheduleHighlightTimeoutRef.current)
    }

    scheduleHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedScheduleItemId((current) =>
        current === selectedScheduleItemId ? null : current,
      )
      scheduleHighlightTimeoutRef.current = null
    }, 2000)
  }, [scheduleItems, selectedScheduleItemId])

  useEffect(() => {
    if (!classId) {
      return
    }

    subscribeClass(classId)

    return () => {
      unsubscribeClass(classId)
    }
  }, [classId, subscribeClass, unsubscribeClass])

  useEffect(() => {
    function scheduleRealtimeRefresh() {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current)
      }

      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null
        void refreshDataRef.current(false)
      }, 250)
    }

    function isCurrentClassEvent(event: RealtimeEventEnvelope) {
      return event.classId === classId
    }

    function shouldRefreshFromRealtime(event: RealtimeEventEnvelope) {
      switch (event.eventType) {
        case realtimeEventTypes.post.created:
        case realtimeEventTypes.post.updated:
        case realtimeEventTypes.comment.created:
        case realtimeEventTypes.comment.updated:
        case realtimeEventTypes.comment.hidden:
        case realtimeEventTypes.reaction.postUpdated:
        case realtimeEventTypes.reaction.commentUpdated:
          return isCurrentClassEvent(event)
        case realtimeEventTypes.notification.created:
        case realtimeEventTypes.notification.read:
          return event.scope === realtimeScopeTypes.user && isCurrentClassEvent(event)
        default:
          return false
      }
    }

    const removeListener = addEventListener((event) => {
      if (!shouldRefreshFromRealtime(event)) {
        return
      }

      scheduleRealtimeRefresh()
    })

    return removeListener
  }, [addEventListener, classId])

  function getCommentDraft(postId: string) {
    return commentDraftByPostId[postId] ?? emptyCommentDraft
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await loadData()
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Refresh failed', message: getErrorMessage(nextError, 'Unable to refresh class dashboard.') })
    } finally {
      setIsRefreshing(false)
    }
  }

  async function handleSetPostReaction(post: ClassFeedItem, reactionType: (typeof reactionTypes)[number]) {
    try {
      const summary = await setPostReactionRequest(classId, post.id, {
        reactionType: post.reactions.viewerReaction === reactionType ? null : reactionType,
      })

      setFeedItems((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, reactions: summary }
            : item,
        ),
      )
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Update reaction failed',
        message: getErrorMessage(nextError, 'Unable to update post reaction.'),
      })
    }
  }

  async function handleSetCommentReaction(
    postId: string,
    commentId: string,
    currentReaction: string | null,
    reactionType: (typeof reactionTypes)[number],
  ) {
    try {
      const summary = await setCommentReactionRequest(classId, commentId, {
        reactionType: currentReaction === reactionType ? null : reactionType,
      })

      setFeedItems((current) =>
        current.map((item) =>
          item.id === postId
            ? {
                ...item,
                comments: item.comments.map((candidate) =>
                  candidate.id === commentId
                    ? { ...candidate, reactions: summary }
                    : candidate,
                ),
              }
            : item,
        ),
      )
    } catch (nextError) {
      setNotice({
        tone: 'error',
        title: 'Update reaction failed',
        message: getErrorMessage(nextError, 'Unable to update comment reaction.'),
      })
    }
  }

  async function runMutation(key: string, action: () => Promise<void>) {
    setBusyKey(key)
    setNotice(null)
    try {
      await action()
      await handleRefresh()
    } finally {
      setBusyKey(null)
    }
  }

  async function handleCreatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!postCreateDraft.title.trim() || !postCreateDraft.content.trim()) {
      setNotice({ tone: 'error', title: 'Missing post content', message: 'Please provide title and content.' })
      return
    }
    try {
      await runMutation('create-post', async () => {
        await createClassPostRequest(classId, toCreatePostRequest(postCreateDraft))
        setPostCreateDraft(emptyPostDraft)
      })
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Create post failed', message: getErrorMessage(nextError, 'Unable to create post.') })
    }
  }

  async function handleUpdatePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!postEditId) return
    const currentPost = feedItems.find((item) => item.id === postEditId)
    if (!currentPost) return
    try {
      await runMutation('update-post', async () => {
        await updateClassPostRequest(classId, postEditId, toUpdatePostRequest(postEditDraft, currentPost))
        setPostEditId(null)
      })
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Update post failed', message: getErrorMessage(nextError, 'Unable to update post.') })
    }
  }

  async function handleCreateComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault()
    const draft = getCommentDraft(postId)
    if (!draft.content.trim()) {
      setNotice({ tone: 'error', title: 'Missing comment content', message: 'Please enter comment content.' })
      return
    }
    try {
      await runMutation(`create-comment-${postId}`, async () => {
        await createClassCommentRequest(classId, postId, toCreateCommentRequest(draft))
        setCommentDraftByPostId((current) => ({ ...current, [postId]: emptyCommentDraft }))
      })
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Create comment failed', message: getErrorMessage(nextError, 'Unable to create comment.') })
    }
  }

  async function handleUpdateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!commentEditId) return
    try {
      await runMutation('update-comment', async () => {
        await updateClassCommentRequest(classId, commentEditId, toUpdateCommentRequest(commentEditDraft))
        setCommentEditId(null)
      })
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Update comment failed', message: getErrorMessage(nextError, 'Unable to update comment.') })
    }
  }

  async function handleCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleCreateDraft.title.trim() || !scheduleCreateDraft.startAt) {
      setNotice({ tone: 'error', title: 'Missing schedule fields', message: 'Please provide title and start date.' })
      return
    }
    try {
      await runMutation('create-schedule', async () => {
        await createClassScheduleItemRequest(classId, toScheduleRequest(scheduleCreateDraft))
        setScheduleCreateDraft((current) => ({ ...emptyScheduleDraft, timezoneId: current.timezoneId }))
      })
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Create schedule failed', message: getErrorMessage(nextError, 'Unable to create schedule item.') })
    }
  }

  async function handleUpdateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleEditId) return
    try {
      await runMutation('update-schedule', async () => {
        await updateClassScheduleItemRequest(classId, scheduleEditId, toScheduleUpdateRequest(scheduleEditDraft))
        setScheduleEditId(null)
      })
    } catch (nextError) {
      setNotice({ tone: 'error', title: 'Update schedule failed', message: getErrorMessage(nextError, 'Unable to update schedule item.') })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3 text-sm font-medium text-muted shadow-sm">
          <Spinner />
          Loading class dashboard...
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return <Notice tone="error" title="Unable to load class dashboard">{error ?? 'Class dashboard is unavailable.'}</Notice>
  }

  return (
    <div className="space-y-6">
      <CardShell className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-strong">{dashboard.classCode}</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">{dashboard.className}</h1>
            <p className="text-base leading-7 text-muted">Status {dashboard.classStatus}. Unified class dashboard for feed, mentions, and schedule.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={session?.primaryRole === 'Teacher' ? '/teacher/dashboard' : '/student/dashboard'}>
              <Button leftIcon={<ArrowLeft className="size-4" />} variant="secondary">Dashboard</Button>
            </Link>
            <Button isLoading={isRefreshing} leftIcon={<RefreshCcw className="size-4" />} onClick={() => { void handleRefresh() }} variant="secondary">Refresh</Button>
          </div>
        </div>
      </CardShell>

      {notice ? <Notice tone={notice.tone} title={notice.title}>{notice.message}</Notice> : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <CardShell className="p-6">
          <h2 className="mb-4 text-xl font-semibold text-ink">Feed</h2>
          {isTeacherOwner ? (
            <form className="mb-5 space-y-3 rounded-2xl border border-line bg-panel p-3" onSubmit={handleCreatePost}>
              <TextField label="Post title" onChange={(event) => setPostCreateDraft((current) => ({ ...current, title: event.target.value }))} value={postCreateDraft.title} />
              <TextareaField label="Post content (plain text)" onChange={(event) => setPostCreateDraft((current) => ({ ...current, content: event.target.value }))} rows={4} value={postCreateDraft.content} />
              <div className="grid gap-3 sm:grid-cols-3">
                <CheckboxField checked={postCreateDraft.allowComments} label="Allow comments" onChange={(event) => setPostCreateDraft((current) => ({ ...current, allowComments: event.target.checked }))} />
                <CheckboxField checked={postCreateDraft.isPinned} label="Pinned" onChange={(event) => setPostCreateDraft((current) => ({ ...current, isPinned: event.target.checked }))} />
                <CheckboxField checked={postCreateDraft.notifyAll} label="Notify all" onChange={(event) => setPostCreateDraft((current) => ({ ...current, notifyAll: event.target.checked }))} />
              </div>
              <MentionCandidatePicker candidates={mentionCandidates} onChange={(nextUserIds) => setPostCreateDraft((current) => ({ ...current, taggedUserIds: nextUserIds }))} selectedUserIds={postCreateDraft.taggedUserIds} />
              <Button isLoading={busyKey === 'create-post'} type="submit">Create post</Button>
            </form>
          ) : null}
          {feedItems.length === 0 ? <p className="text-sm text-muted">No posts yet.</p> : (
            <div className="space-y-4">
              {feedItems.map((post) => (
                <article className="space-y-3 rounded-3xl border border-line bg-surface p-4" key={post.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{post.title}</p>
                      <p className="text-sm text-muted">By {post.authorName} • {formatUtcDate(post.publishedAtUtc ?? post.createdAtUtc)}</p>
                    </div>
                    <span className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-muted">{post.status}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink">{post.contentPlainText || '(Empty content)'}</p>
                  {renderMentionSummary(post.mentions, mentionCandidateByUserId)}
                  <div className="flex flex-wrap gap-2">
                    {reactionTypes.map((reactionType) => (
                      <button className={cn('focus-ring min-h-11 rounded-full border px-3 text-sm transition', post.reactions.viewerReaction === reactionType ? 'border-brand bg-brand-soft text-brand-strong' : 'border-line bg-panel text-ink hover:border-brand/30 hover:bg-brand-soft/45')} key={reactionType} onClick={() => { void handleSetPostReaction(post, reactionType) }} type="button">{reactionType}</button>
                    ))}
                    <span className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm text-muted">{post.reactions.totalCount} reactions</span>
                  </div>
                  {isTeacherOwner ? (
                    postEditId === post.id ? (
                      <form className="space-y-3 rounded-2xl border border-line bg-panel p-3" onSubmit={handleUpdatePost}>
                        <TextField label="Edit title" onChange={(event) => setPostEditDraft((current) => ({ ...current, title: event.target.value }))} value={postEditDraft.title} />
                        <TextareaField label="Edit content" onChange={(event) => setPostEditDraft((current) => ({ ...current, content: event.target.value }))} rows={3} value={postEditDraft.content} />
                        <div className="grid gap-3 sm:grid-cols-3">
                          <CheckboxField checked={postEditDraft.allowComments} label="Allow comments" onChange={(event) => setPostEditDraft((current) => ({ ...current, allowComments: event.target.checked }))} />
                          <CheckboxField checked={postEditDraft.isPinned} label="Pinned" onChange={(event) => setPostEditDraft((current) => ({ ...current, isPinned: event.target.checked }))} />
                          <CheckboxField checked={postEditDraft.notifyAll} label="Notify all" onChange={(event) => setPostEditDraft((current) => ({ ...current, notifyAll: event.target.checked }))} />
                        </div>
                        <MentionCandidatePicker candidates={mentionCandidates} onChange={(nextUserIds) => setPostEditDraft((current) => ({ ...current, taggedUserIds: nextUserIds }))} selectedUserIds={postEditDraft.taggedUserIds} />
                        <div className="flex flex-wrap gap-2">
                          <Button isLoading={busyKey === 'update-post'} type="submit">Save post</Button>
                          <Button onClick={() => setPostEditId(null)} type="button" variant="secondary">Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <Button onClick={() => { setPostEditId(post.id); setPostEditDraft({ title: post.title, content: post.contentPlainText, allowComments: post.allowComments, isPinned: post.isPinned, notifyAll: post.notifyAll, taggedUserIds: post.mentions.taggedUserIds }) }} size="md" variant="secondary">Edit post</Button>
                    )
                  ) : null}
                  <div className="space-y-3 rounded-2xl border border-line bg-panel p-3">
                    <p className="text-sm font-semibold text-ink">Comments ({post.comments.length})</p>
                    {post.comments.map((comment) => (
                      <div className="rounded-2xl border border-line bg-surface p-3" key={comment.id}>
                        <p className="text-sm font-semibold text-ink">{comment.authorName}</p>
                        <p className="whitespace-pre-wrap text-sm text-ink">{comment.contentPlainText || '(Empty comment)'}</p>
                        {renderMentionSummary(comment.mentions, mentionCandidateByUserId)}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reactionTypes.map((reactionType) => (
                            <button className={cn('focus-ring min-h-11 rounded-full border px-3 text-xs transition', comment.reactions.viewerReaction === reactionType ? 'border-brand bg-brand-soft text-brand-strong' : 'border-line bg-panel text-ink hover:border-brand/30 hover:bg-brand-soft/45')} key={reactionType} onClick={() => { void handleSetCommentReaction(post.id, comment.id, comment.reactions.viewerReaction, reactionType) }} type="button">{reactionType}</button>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {comment.authorUserId === session?.userId ? (
                            <Button onClick={() => { setCommentEditId(comment.id); setCommentEditDraft({ content: comment.contentPlainText, notifyAll: comment.notifyAll, taggedUserIds: comment.mentions.taggedUserIds }) }} size="md" variant="secondary">Edit</Button>
                          ) : null}
                          {isTeacherOwner && !comment.isHidden ? (
                            <Button isLoading={busyKey === `hide-comment-${comment.id}`} onClick={() => { void runMutation(`hide-comment-${comment.id}`, async () => { await hideClassCommentRequest(classId, comment.id) }) }} size="md" variant="danger">Hide</Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {canComment && post.allowComments ? (
                      <form className="space-y-3 rounded-2xl border border-line bg-surface p-3" onSubmit={(event) => { void handleCreateComment(event, post.id) }}>
                        <TextareaField label="Add comment" onChange={(event) => setCommentDraftByPostId((current) => ({ ...current, [post.id]: { ...getCommentDraft(post.id), content: event.target.value } }))} rows={3} value={getCommentDraft(post.id).content} />
                        <CheckboxField checked={getCommentDraft(post.id).notifyAll} label="Notify all" onChange={(event) => setCommentDraftByPostId((current) => ({ ...current, [post.id]: { ...getCommentDraft(post.id), notifyAll: event.target.checked } }))} />
                        <MentionCandidatePicker candidates={mentionCandidates} onChange={(nextUserIds) => setCommentDraftByPostId((current) => ({ ...current, [post.id]: { ...getCommentDraft(post.id), taggedUserIds: nextUserIds } }))} selectedUserIds={getCommentDraft(post.id).taggedUserIds} />
                        <Button isLoading={busyKey === `create-comment-${post.id}`} type="submit">Send comment</Button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardShell>

        <div className="space-y-6">
          <CardShell className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ink">Pilot shortcuts</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-sm font-semibold text-ink">Unread notifications</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {dashboard.unreadNotificationCount}
                  </p>
                  <div className="mt-3">
                    <Link to={`/notifications?classId=${classId}`}>
                      <Button size="md" variant="secondary">Open inbox</Button>
                    </Link>
                  </div>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <p className="text-sm font-semibold text-ink">Assessments</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Move into draft, publish, results, and student attempt flows for this class.
                  </p>
                  <div className="mt-3">
                    <Link to={`/classes/${classId}/assessments`}>
                      <Button size="md" variant="secondary">Open assessments</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardShell>
          {isTeacherOwner ? (
            <CardShell className="p-6">
              <form className="space-y-3" onSubmit={handleCreateSchedule}>
                <h2 className="text-xl font-semibold text-ink">Create schedule</h2>
                <TextField label="Type" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, type: event.target.value }))} value={scheduleCreateDraft.type} />
                <TextField label="Title" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, title: event.target.value }))} value={scheduleCreateDraft.title} />
                <TextareaField label="Description (plain text)" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, description: event.target.value }))} rows={3} value={scheduleCreateDraft.description} />
                <TextField label="Start at" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, startAt: event.target.value }))} type="datetime-local" value={scheduleCreateDraft.startAt} />
                <TextField label="End at" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, endAt: event.target.value }))} type="datetime-local" value={scheduleCreateDraft.endAt} />
                <TextField label="Timezone" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, timezoneId: event.target.value }))} value={scheduleCreateDraft.timezoneId} />
                <CheckboxField checked={scheduleCreateDraft.isAllDay} label="All day" onChange={(event) => setScheduleCreateDraft((current) => ({ ...current, isAllDay: event.target.checked }))} />
                <Button isLoading={busyKey === 'create-schedule'} type="submit">Create schedule item</Button>
              </form>
            </CardShell>
          ) : null}
          <CardShell className="p-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Schedule</h2>
            {scheduleItems.length === 0 ? <p className="text-sm text-muted">No schedule items yet.</p> : (
              <div className="space-y-3">
                {scheduleItems.map((item) => (
                  <div
                    className={cn(
                      'rounded-2xl border border-line bg-surface p-3 transition-colors',
                      highlightedScheduleItemId === item.id && 'border-brand/40 bg-brand-soft/40 ring-2 ring-brand/20',
                    )}
                    data-schedule-item-id={item.id}
                    key={item.id}
                    ref={(node) => {
                      scheduleItemRefs.current[item.id] = node
                    }}
                  >
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="text-sm text-muted">{item.type} • {formatUtcDate(item.startAtUtc)}{item.endAtUtc ? ` -> ${formatUtcDate(item.endAtUtc)}` : ''}</p>
                    <p className="text-sm text-ink">{item.descriptionPlainText || '(No description)'}</p>
                    {isTeacherOwner ? (
                      scheduleEditId === item.id ? (
                        <form className="mt-3 space-y-3 rounded-2xl border border-line bg-panel p-3" onSubmit={handleUpdateSchedule}>
                          <TextField label="Type" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, type: event.target.value }))} value={scheduleEditDraft.type} />
                          <TextField label="Title" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, title: event.target.value }))} value={scheduleEditDraft.title} />
                          <TextareaField label="Description" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, description: event.target.value }))} rows={3} value={scheduleEditDraft.description} />
                          <TextField label="Start at" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, startAt: event.target.value }))} type="datetime-local" value={scheduleEditDraft.startAt} />
                          <TextField label="End at" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, endAt: event.target.value }))} type="datetime-local" value={scheduleEditDraft.endAt} />
                          <TextField label="Timezone" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, timezoneId: event.target.value }))} value={scheduleEditDraft.timezoneId} />
                          <CheckboxField checked={scheduleEditDraft.isAllDay} label="All day" onChange={(event) => setScheduleEditDraft((current) => ({ ...current, isAllDay: event.target.checked }))} />
                          <div className="flex gap-2">
                            <Button isLoading={busyKey === 'update-schedule'} type="submit">Save</Button>
                            <Button onClick={() => setScheduleEditId(null)} type="button" variant="secondary">Cancel</Button>
                          </div>
                        </form>
                      ) : (
                        <Button onClick={() => { setScheduleEditId(item.id); setScheduleEditDraft({ type: item.type, title: item.title, description: item.descriptionPlainText, startAt: toLocalInput(item.startAtUtc), endAt: toLocalInput(item.endAtUtc), timezoneId: item.timezoneId, isAllDay: item.isAllDay }) }} size="md" variant="secondary">Edit schedule</Button>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardShell>
        </div>
      </div>

      {commentEditId ? (
        <CardShell className="p-6">
          <form className="space-y-3" onSubmit={handleUpdateComment}>
            <h2 className="text-xl font-semibold text-ink">Edit selected comment</h2>
            <TextareaField label="Comment content" onChange={(event) => setCommentEditDraft((current) => ({ ...current, content: event.target.value }))} rows={3} value={commentEditDraft.content} />
            <CheckboxField checked={commentEditDraft.notifyAll} label="Notify all" onChange={(event) => setCommentEditDraft((current) => ({ ...current, notifyAll: event.target.checked }))} />
            <MentionCandidatePicker candidates={mentionCandidates} onChange={(nextUserIds) => setCommentEditDraft((current) => ({ ...current, taggedUserIds: nextUserIds }))} selectedUserIds={commentEditDraft.taggedUserIds} />
            <div className="flex gap-2">
              <Button isLoading={busyKey === 'update-comment'} type="submit">Save comment</Button>
              <Button onClick={() => setCommentEditId(null)} type="button" variant="secondary">Cancel</Button>
            </div>
          </form>
        </CardShell>
      ) : null}
    </div>
  )
}
