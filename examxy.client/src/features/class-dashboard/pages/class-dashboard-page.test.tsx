import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ClassDashboardPage } from '@/features/class-dashboard/pages/class-dashboard-page'
import type { AuthSession } from '@/types/auth'

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

function setupApi({
  isTeacherOwner,
}: {
  isTeacherOwner: boolean
}) {
  apiMock.getClassDashboardRequest.mockResolvedValue({
    classId: 'class-1',
    className: 'Class 1',
    classCode: 'CLS001',
    classStatus: 'Active',
    timezoneId: 'UTC',
    isTeacherOwner,
    activeStudentCount: 10,
    feedItemCount: 0,
    upcomingScheduleCount: 0,
    unreadNotificationCount: 0,
  })
  apiMock.getClassFeedRequest.mockResolvedValue([])
  apiMock.getClassScheduleItemsRequest.mockResolvedValue([])
  apiMock.getClassMentionCandidatesRequest.mockResolvedValue([])
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
})
