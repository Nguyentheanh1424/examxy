import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ClassDashboardPage } from '@/features/class-dashboard/pages/class-dashboard-page'
import { realtimeEventTypes, realtimeScopeTypes } from '@/features/realtime/lib/realtime-event-types'
import type { AuthSession } from '@/types/auth'
import type { ClassDashboard, ClassFeedItem, ClassMentionCandidate, ClassScheduleItem } from '@/types/class-content'
import type { RealtimeEventEnvelope } from '@/features/realtime/types/realtime'

const { useAuthMock, useRealtimeMock, apiMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useRealtimeMock: vi.fn(),
  apiMock: {
    createClassCommentRequest: vi.fn(),
    createClassPostRequest: vi.fn(),
    createClassScheduleItemRequest: vi.fn(),
    getClassDashboardRequest: vi.fn(),
    getClassFeedRequest: vi.fn(),
    getClassMentionCandidatesRequest: vi.fn(),
    getClassScheduleItemsRequest: vi.fn(),
    hideClassCommentRequest: vi.fn(),
    setCommentReactionRequest: vi.fn(),
    setPostReactionRequest: vi.fn(),
    updateClassCommentRequest: vi.fn(),
    updateClassPostRequest: vi.fn(),
    updateClassScheduleItemRequest: vi.fn(),
  },
}))

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('@/features/class-content/lib/class-content-api', () => apiMock)
vi.mock('@/features/realtime/use-realtime', () => ({
  useRealtime: () => useRealtimeMock(),
}))

const teacherSession: AuthSession = {
  userId: 'teacher-1',
  userName: 'teacher',
  email: 'teacher@example.test',
  primaryRole: 'Teacher',
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAtUtc: '2030-01-01T00:00:00.000Z',
  roles: ['Teacher'],
}

const studentSession: AuthSession = {
  ...teacherSession,
  userId: 'student-1',
  userName: 'student',
  email: 'student@example.test',
  primaryRole: 'Student',
  roles: ['Student'],
}

function createPostFixture(overrides: Partial<ClassFeedItem> = {}): ClassFeedItem {
  return {
    id: 'post-1',
    type: 'Post',
    status: 'Published',
    title: 'Welcome post',
    contentRichText: 'Welcome body',
    contentPlainText: 'Welcome body',
    allowComments: true,
    isPinned: false,
    notifyAll: false,
    publishAtUtc: null,
    closeAtUtc: null,
    publishedAtUtc: '2026-04-15T08:00:00.000Z',
    createdAtUtc: '2026-04-15T08:00:00.000Z',
    updatedAtUtc: '2026-04-15T08:00:00.000Z',
    authorUserId: 'teacher-1',
    authorName: 'Teacher',
    attachments: [],
    comments: [],
    reactions: {
      viewerReaction: null,
      totalCount: 0,
      counts: [],
    },
    mentions: {
      notifyAll: false,
      taggedUserIds: [],
    },
    ...overrides,
  }
}

function createScheduleFixture(overrides: Partial<ClassScheduleItem> = {}): ClassScheduleItem {
  return {
    id: 'schedule-1',
    type: 'Deadline',
    title: 'Essay deadline',
    descriptionRichText: '<p>Essay deadline</p>',
    descriptionPlainText: 'Essay deadline',
    startAtUtc: '2026-04-22T10:00:00.000Z',
    endAtUtc: null,
    timezoneId: 'UTC',
    isAllDay: false,
    relatedPostId: null,
    relatedAssessmentId: null,
    ...overrides,
  }
}

function setupApi({
  isTeacherOwner,
  feedItems = [],
  mentionCandidates = [],
  scheduleItems = [],
  dashboardOverrides = {},
}: {
  isTeacherOwner: boolean
  feedItems?: ClassFeedItem[]
  mentionCandidates?: ClassMentionCandidate[]
  scheduleItems?: ClassScheduleItem[]
  dashboardOverrides?: Partial<ClassDashboard>
}) {
  Object.values(apiMock).forEach((mockedFunction) => mockedFunction.mockReset())

  apiMock.getClassDashboardRequest.mockResolvedValue({
    classId: 'class-1',
    className: 'Class 1',
    classCode: 'CLS001',
    classStatus: 'Active',
    timezoneId: 'UTC',
    isTeacherOwner,
    activeStudentCount: 10,
    feedItemCount: feedItems.length,
    upcomingScheduleCount: scheduleItems.length,
    unreadNotificationCount: 0,
    ...dashboardOverrides,
  })
  apiMock.getClassFeedRequest.mockResolvedValue(feedItems)
  apiMock.getClassScheduleItemsRequest.mockResolvedValue(scheduleItems)
  apiMock.getClassMentionCandidatesRequest.mockResolvedValue(mentionCandidates)
  apiMock.createClassPostRequest.mockResolvedValue({})
  apiMock.setPostReactionRequest.mockResolvedValue({
    viewerReaction: 'Like',
    totalCount: 1,
    counts: [{ reactionType: 'Like', count: 1 }],
  })
  apiMock.setCommentReactionRequest.mockResolvedValue({
    viewerReaction: 'Like',
    totalCount: 1,
    counts: [{ reactionType: 'Like', count: 1 }],
  })
}

function renderPage(path = '/classes/class-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ClassDashboardPage />} path="/classes/:classId" />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ClassDashboardPage', () => {
  function setupRealtime() {
    let listener: ((event: RealtimeEventEnvelope) => void) | null = null
    const subscribeClass = vi.fn()
    const unsubscribeClass = vi.fn()

    useRealtimeMock.mockReturnValue({
      addEventListener(nextListener: (event: RealtimeEventEnvelope) => void) {
        listener = nextListener
        return () => {
          listener = null
        }
      },
      subscribeClass,
      unsubscribeClass,
    })

    return {
      emit(event: RealtimeEventEnvelope) {
        listener?.(event)
      },
      subscribeClass,
      unsubscribeClass,
    }
  }

  it('renders class dashboard read state', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Class 1' })).toBeInTheDocument()
    expect(screen.getByText('CLS001')).toBeInTheDocument()
  })

  it('renders summary cards from class dashboard fields', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({
      isTeacherOwner: true,
      dashboardOverrides: {
        activeStudentCount: 24,
        feedItemCount: 8,
        upcomingScheduleCount: 3,
        unreadNotificationCount: 2,
      },
    })

    renderPage()

    const summary = await screen.findByLabelText('Class dashboard summary')
    expect(within(summary).getByText('Active students')).toBeInTheDocument()
    expect(within(summary).getByText('24')).toBeInTheDocument()
    expect(within(summary).getByText('Feed items')).toBeInTheDocument()
    expect(within(summary).getByText('8')).toBeInTheDocument()
    expect(within(summary).getByText('Upcoming schedule')).toBeInTheDocument()
    expect(within(summary).getByText('3')).toBeInTheDocument()
    expect(within(summary).getByText('Unread notifications')).toBeInTheDocument()
    expect(within(summary).getByText('2')).toBeInTheDocument()
  })

  it('filters loaded feed items locally with supported tabs', async () => {
    const user = userEvent.setup()
    const feedItems = [
      createPostFixture({ id: 'post-pinned', isPinned: true, title: 'Pinned note' }),
      createPostFixture({ id: 'post-announcement', type: 'Announcement', title: 'Announcement note' }),
      createPostFixture({ id: 'post-regular', title: 'Regular note' }),
    ]

    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true, feedItems })

    renderPage()

    await screen.findByText('Regular note')
    await user.click(screen.getByRole('tab', { name: 'Pinned (1)' }))

    expect(screen.getByText('Pinned note')).toBeInTheDocument()
    expect(screen.queryByText('Regular note')).not.toBeInTheDocument()
    expect(screen.queryByText('Announcement note')).not.toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Announcements (1)' }))

    expect(screen.getByText('Announcement note')).toBeInTheDocument()
    expect(screen.queryByText('Pinned note')).not.toBeInTheDocument()
    expect(screen.queryByText('Regular note')).not.toBeInTheDocument()
  })

  it('renders empty feed and schedule states without mock records', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true })

    renderPage()

    expect(await screen.findByText('No posts yet')).toBeInTheDocument()
    expect(screen.getByText('No schedule items yet')).toBeInTheDocument()
  })

  it('shows teacher write actions for owner', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true })

    renderPage()

    expect(await screen.findByLabelText('Post title')).toBeInTheDocument()
    expect(screen.getByLabelText('Start at')).toBeInTheDocument()
  })

  it('hides teacher write actions for student role', async () => {
    useAuthMock.mockReturnValue({ session: studentSession })
    setupRealtime()
    setupApi({ isTeacherOwner: false })

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    expect(screen.queryByLabelText('Post title')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Start at')).not.toBeInTheDocument()
  })

  it('submits create post using class-content API', async () => {
    const user = userEvent.setup()

    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true })

    renderPage()

    await screen.findByLabelText('Post title')
    await user.type(screen.getByLabelText('Post title'), 'Announcement')
    await user.type(screen.getByLabelText('Post content (plain text)'), 'Weekly reminder')
    await user.click(screen.getByRole('button', { name: 'Create post' }))

    await waitFor(() => {
      expect(apiMock.createClassPostRequest).toHaveBeenCalledWith(
        'class-1',
        expect.objectContaining({
          title: 'Announcement',
          contentPlainText: 'Weekly reminder',
          contentRichText: 'Weekly reminder',
        }),
      )
    })
  })

  it('shows notice when post reaction API fails and keeps reaction summary unchanged', async () => {
    const user = userEvent.setup()
    const feedItems = [createPostFixture()]

    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true, feedItems })
    apiMock.setPostReactionRequest.mockRejectedValueOnce(new Error('post reaction failed'))

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    expect(screen.getByText('0 reactions')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Like' })[0])

    expect(await screen.findByText('Update reaction failed')).toBeInTheDocument()
    expect(screen.getByText('0 reactions')).toBeInTheDocument()
  })

  it('shows notice when comment reaction API fails and does not mark reaction as selected', async () => {
    const user = userEvent.setup()
    const feedItems = [
      createPostFixture({
        comments: [
          {
            id: 'comment-1',
            postId: 'post-1',
            authorUserId: 'student-1',
            authorName: 'Student',
            contentRichText: 'Comment body',
            contentPlainText: 'Comment body',
            notifyAll: false,
            isHidden: false,
            createdAtUtc: '2026-04-15T08:10:00.000Z',
            updatedAtUtc: '2026-04-15T08:10:00.000Z',
            reactions: {
              viewerReaction: null,
              totalCount: 0,
              counts: [],
            },
            mentions: {
              notifyAll: false,
              taggedUserIds: [],
            },
          },
        ],
      }),
    ]

    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true, feedItems })
    apiMock.setCommentReactionRequest.mockRejectedValueOnce(new Error('comment reaction failed'))

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    const commentCard = screen.getByText('Comment body').closest('div')
    expect(commentCard).not.toBeNull()

    const likeButton = within(commentCard as HTMLElement).getByRole('button', { name: 'Like' })
    await user.click(likeButton)

    expect(await screen.findByText('Update reaction failed')).toBeInTheDocument()
    expect(likeButton.className).toContain('border-line')
    expect(likeButton.className).not.toContain('text-brand-strong')
  })

  it('renders mention summary with notify all and tagged users including fallback user id', async () => {
    const feedItems = [
      createPostFixture({
        mentions: {
          notifyAll: true,
          taggedUserIds: ['student-1', 'missing-post-user'],
        },
        comments: [
          {
            id: 'comment-1',
            postId: 'post-1',
            authorUserId: 'student-1',
            authorName: 'Student',
            contentRichText: 'Comment body',
            contentPlainText: 'Comment body',
            notifyAll: false,
            isHidden: false,
            createdAtUtc: '2026-04-15T08:10:00.000Z',
            updatedAtUtc: '2026-04-15T08:10:00.000Z',
            reactions: {
              viewerReaction: null,
              totalCount: 0,
              counts: [],
            },
            mentions: {
              notifyAll: true,
              taggedUserIds: ['student-1', 'missing-comment-user'],
            },
          },
        ],
      }),
    ]

    const mentionCandidates: ClassMentionCandidate[] = [
      {
        userId: 'student-1',
        displayName: 'Lan Tran',
        email: 'lan@example.test',
      },
    ]

    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({ isTeacherOwner: true, feedItems, mentionCandidates })

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })

    expect(screen.getAllByText('Notify all').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('@Lan Tran').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('@missing-post-user')).toBeInTheDocument()
    expect(screen.getByText('@missing-comment-user')).toBeInTheDocument()
  })

  it('subscribes to the current class and unsubscribes on unmount', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    const realtime = setupRealtime()
    setupApi({ isTeacherOwner: true })

    const view = renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    expect(realtime.subscribeClass).toHaveBeenCalledWith('class-1')

    view.unmount()

    expect(realtime.unsubscribeClass).toHaveBeenCalledWith('class-1')
  })

  it('refreshes dashboard state when a class realtime event arrives', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    const realtime = setupRealtime()
    setupApi({ isTeacherOwner: true })

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    expect(apiMock.getClassDashboardRequest).toHaveBeenCalledTimes(1)

    realtime.emit({
      eventId: 'event-1',
      eventType: realtimeEventTypes.post.created,
      occurredAtUtc: '2026-04-21T10:00:00.000Z',
      scope: realtimeScopeTypes.class,
      classId: 'class-1',
      actorUserId: teacherSession.userId,
      payload: {},
    })

    await new Promise((resolve) => window.setTimeout(resolve, 350))

    await waitFor(() => {
      expect(apiMock.getClassDashboardRequest).toHaveBeenCalledTimes(2)
    })
  })

  it('ignores realtime events for other classes', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    const realtime = setupRealtime()
    setupApi({ isTeacherOwner: true })

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    expect(apiMock.getClassDashboardRequest).toHaveBeenCalledTimes(1)

    realtime.emit({
      eventId: 'event-2',
      eventType: realtimeEventTypes.post.updated,
      occurredAtUtc: '2026-04-21T10:05:00.000Z',
      scope: realtimeScopeTypes.class,
      classId: 'class-2',
      actorUserId: teacherSession.userId,
      payload: {},
    })

    await new Promise((resolve) => window.setTimeout(resolve, 350))

    expect(apiMock.getClassDashboardRequest).toHaveBeenCalledTimes(1)
  })

  it('scrolls to and highlights the requested schedule item from the query string', async () => {
    const scrollIntoViewMock = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })

    useAuthMock.mockReturnValue({ session: teacherSession })
    setupRealtime()
    setupApi({
      isTeacherOwner: true,
      scheduleItems: [
        createScheduleFixture(),
      ],
    })

    renderPage('/classes/class-1?scheduleItemId=schedule-1')

    expect(await screen.findByText('Essay deadline', { selector: 'p.font-semibold' })).toBeInTheDocument()
    expect(scrollIntoViewMock).toHaveBeenCalled()

    const scheduleCard = screen
      .getByText('Essay deadline', { selector: 'p.font-semibold' })
      .closest('[data-schedule-item-id="schedule-1"]')
    expect(scheduleCard).not.toBeNull()
    await waitFor(() => {
      expect(scheduleCard?.className).toContain('ring-2')
    })
  })
})
