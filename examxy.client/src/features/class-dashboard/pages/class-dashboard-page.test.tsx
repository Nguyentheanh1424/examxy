import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ClassDashboardPage } from '@/features/class-dashboard/pages/class-dashboard-page'
import type { AuthSession } from '@/types/auth'
import type { ClassFeedItem, ClassMentionCandidate } from '@/types/class-content'

const { useAuthMock, apiMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
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

function setupApi({
  isTeacherOwner,
  feedItems = [],
  mentionCandidates = [],
}: {
  isTeacherOwner: boolean
  feedItems?: ClassFeedItem[]
  mentionCandidates?: ClassMentionCandidate[]
}) {
  apiMock.getClassDashboardRequest.mockResolvedValue({
    classId: 'class-1',
    className: 'Class 1',
    classCode: 'CLS001',
    classStatus: 'Active',
    timezoneId: 'UTC',
    isTeacherOwner,
    activeStudentCount: 10,
    feedItemCount: feedItems.length,
    upcomingScheduleCount: 0,
    unreadNotificationCount: 0,
  })
  apiMock.getClassFeedRequest.mockResolvedValue(feedItems)
  apiMock.getClassScheduleItemsRequest.mockResolvedValue([])
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/classes/class-1']}>
      <Routes>
        <Route element={<ClassDashboardPage />} path="/classes/:classId" />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ClassDashboardPage', () => {
  it('renders class dashboard read state', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    setupApi({ isTeacherOwner: true })

    renderPage()

    expect(screen.getByText('Loading class dashboard...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Class 1' })).toBeInTheDocument()
    expect(screen.getByText('CLS001')).toBeInTheDocument()
  })

  it('shows teacher write actions for owner', async () => {
    useAuthMock.mockReturnValue({ session: teacherSession })
    setupApi({ isTeacherOwner: true })

    renderPage()

    expect(await screen.findByLabelText('Post title')).toBeInTheDocument()
    expect(screen.getByLabelText('Start at')).toBeInTheDocument()
  })

  it('hides teacher write actions for student role', async () => {
    useAuthMock.mockReturnValue({ session: studentSession })
    setupApi({ isTeacherOwner: false })

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })
    expect(screen.queryByLabelText('Post title')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Start at')).not.toBeInTheDocument()
  })

  it('submits create post using class-content API', async () => {
    const user = userEvent.setup()

    useAuthMock.mockReturnValue({ session: teacherSession })
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
    setupApi({ isTeacherOwner: true, feedItems, mentionCandidates })

    renderPage()

    await screen.findByRole('heading', { name: 'Class 1' })

    expect(screen.getAllByText('Notify all').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('@Lan Tran').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('@missing-post-user')).toBeInTheDocument()
    expect(screen.getByText('@missing-comment-user')).toBeInTheDocument()
  })
})
