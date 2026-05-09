import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { NotificationsPage } from '@/features/notifications/pages/notifications-page'

const { useRealtimeMock, notificationApiMock } = vi.hoisted(() => ({
  useRealtimeMock: vi.fn(),
  notificationApiMock: {
    getNotificationsRequest: vi.fn(),
    markAllNotificationsAsReadRequest: vi.fn(),
    markNotificationAsReadRequest: vi.fn(),
  },
}))

vi.mock('@/features/realtime/use-realtime', () => ({
  useRealtime: () => useRealtimeMock(),
}))

vi.mock('@/features/notifications/lib/notification-api', () => notificationApiMock)

function renderPage(path = '/notifications') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<NotificationsPage />} path="/notifications" />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NotificationsPage', () => {
  it('renders inbox items and resolves assessment targets', async () => {
    useRealtimeMock.mockReturnValue({
      addEventListener: vi.fn(() => vi.fn()),
    })
    notificationApiMock.getNotificationsRequest.mockResolvedValue({
      unreadCount: 2,
      items: [
        {
          id: 'notification-1',
          classId: 'class-1',
          recipientUserId: 'student-1',
          actorUserId: 'teacher-1',
          notificationType: 'AssessmentPublished',
          sourceType: 'Assessment',
          sourceId: 'assessment-1',
          title: 'Quiz published',
          message: 'Open the assessment now.',
          linkPath: '/classes/class-1',
          featureArea: 'assessments',
          postId: null,
          commentId: null,
          assessmentId: 'assessment-1',
          scheduleItemId: null,
          isRead: false,
          readAtUtc: null,
          createdAtUtc: '2026-04-21T00:00:00.000Z',
        },
      ],
    })

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Notification inbox' })).toBeInTheDocument()
    expect(screen.getByText('Quiz published')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Open target' })).toHaveAttribute(
      'href',
      '/classes/class-1/assessments?assessmentId=assessment-1',
    )
  })

  it('marks all notifications as read for the current filter', async () => {
    const user = userEvent.setup()

    useRealtimeMock.mockReturnValue({
      addEventListener: vi.fn(() => vi.fn()),
    })
    notificationApiMock.getNotificationsRequest.mockResolvedValue({
      unreadCount: 1,
      items: [
        {
          id: 'notification-1',
          classId: 'class-1',
          recipientUserId: 'student-1',
          actorUserId: 'teacher-1',
          notificationType: 'MentionedInPost',
          sourceType: 'Post',
          sourceId: 'post-1',
          title: 'Mention',
          message: 'You were tagged.',
          linkPath: '/classes/class-1',
          featureArea: 'feed',
          postId: 'post-1',
          commentId: null,
          assessmentId: null,
          scheduleItemId: null,
          isRead: false,
          readAtUtc: null,
          createdAtUtc: '2026-04-21T00:00:00.000Z',
        },
      ],
    })
    notificationApiMock.markAllNotificationsAsReadRequest.mockResolvedValue({
      updatedCount: 1,
      unreadCount: 0,
    })

    renderPage('/notifications?classId=class-1')

    await screen.findByText('Mention')
    await user.click(screen.getByRole('button', { name: 'Mark all read' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Mark all read' }))

    await waitFor(() => {
      expect(notificationApiMock.markAllNotificationsAsReadRequest).toHaveBeenCalledWith({
        classId: 'class-1',
      })
    })
  })

  it('resolves schedule reminder targets to the class dashboard query string', async () => {
    useRealtimeMock.mockReturnValue({
      addEventListener: vi.fn(() => vi.fn()),
    })
    notificationApiMock.getNotificationsRequest.mockResolvedValue({
      unreadCount: 1,
      items: [
        {
          id: 'notification-2',
          classId: 'class-1',
          recipientUserId: 'student-1',
          actorUserId: 'teacher-1',
          notificationType: 'ScheduleItemReminder24Hours',
          sourceType: 'ScheduleItem',
          sourceId: 'schedule-1',
          title: 'Deadline reminder',
          message: 'A class deadline is due in 24 hours.',
          linkPath: '/classes/class-1',
          featureArea: 'schedule',
          postId: null,
          commentId: null,
          assessmentId: null,
          scheduleItemId: 'schedule-1',
          isRead: false,
          readAtUtc: null,
          createdAtUtc: '2026-04-21T00:00:00.000Z',
        },
      ],
    })

    renderPage()

    expect(await screen.findByText('Deadline reminder')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open target' })).toHaveAttribute(
      'href',
      '/classes/class-1?scheduleItemId=schedule-1',
    )
  })
})
