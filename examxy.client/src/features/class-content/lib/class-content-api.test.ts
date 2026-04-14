import { describe, expect, it, vi } from 'vitest'

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
import { apiRequest } from '@/lib/http/api-client'

vi.mock('@/lib/http/api-client', () => ({
  apiRequest: vi.fn(),
}))

const apiRequestMock = vi.mocked(apiRequest)

describe('class-content-api', () => {
  it('calls class dashboard and read endpoints with auth', async () => {
    apiRequestMock.mockResolvedValueOnce({} as never)
    await getClassDashboardRequest('class-1')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/dashboard', {
      auth: true,
    })

    apiRequestMock.mockResolvedValueOnce([] as never)
    await getClassFeedRequest('class-1')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/feed', {
      auth: true,
    })

    apiRequestMock.mockResolvedValueOnce([] as never)
    await getClassMentionCandidatesRequest('class-1')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/mention-candidates', {
      auth: true,
    })

    apiRequestMock.mockResolvedValueOnce([] as never)
    await getClassScheduleItemsRequest('class-1')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/schedule-items', {
      auth: true,
    })
  })

  it('calls post/comment/reaction write endpoints with method and auth', async () => {
    const postBody = {
      type: 'Post',
      title: 'Title',
      contentRichText: 'Body',
      contentPlainText: 'Body',
      allowComments: true,
      isPinned: false,
      notifyAll: false,
      publishAtUtc: null,
      closeAtUtc: null,
      taggedUserIds: [],
      attachments: [],
    }

    apiRequestMock.mockResolvedValueOnce({} as never)
    await createClassPostRequest('class-1', postBody)
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/posts', {
      auth: true,
      method: 'POST',
      body: postBody,
    })

    const updateBody = {
      title: 'Updated',
      contentRichText: 'Body',
      contentPlainText: 'Body',
      allowComments: true,
      isPinned: false,
      notifyAll: false,
      publishAtUtc: null,
      closeAtUtc: null,
      status: 'Published',
      taggedUserIds: [],
    }

    apiRequestMock.mockResolvedValueOnce({} as never)
    await updateClassPostRequest('class-1', 'post-1', updateBody)
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/posts/post-1', {
      auth: true,
      method: 'PUT',
      body: updateBody,
    })

    const commentBody = {
      contentRichText: 'Comment',
      contentPlainText: 'Comment',
      notifyAll: false,
      taggedUserIds: [],
    }

    apiRequestMock.mockResolvedValueOnce({} as never)
    await createClassCommentRequest('class-1', 'post-1', commentBody)
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/posts/post-1/comments', {
      auth: true,
      method: 'POST',
      body: commentBody,
    })

    apiRequestMock.mockResolvedValueOnce({} as never)
    await updateClassCommentRequest('class-1', 'comment-1', commentBody)
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/comments/comment-1', {
      auth: true,
      method: 'PUT',
      body: commentBody,
    })

    apiRequestMock.mockResolvedValueOnce(undefined as never)
    await hideClassCommentRequest('class-1', 'comment-1')
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/comments/comment-1', {
      auth: true,
      method: 'DELETE',
    })

    apiRequestMock.mockResolvedValueOnce({} as never)
    await setPostReactionRequest('class-1', 'post-1', { reactionType: 'Like' })
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/posts/post-1/reaction', {
      auth: true,
      method: 'PUT',
      body: { reactionType: 'Like' },
    })

    apiRequestMock.mockResolvedValueOnce({} as never)
    await setCommentReactionRequest('class-1', 'comment-1', { reactionType: null })
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/comments/comment-1/reaction', {
      auth: true,
      method: 'PUT',
      body: { reactionType: null },
    })
  })

  it('calls schedule write endpoints', async () => {
    const scheduleBody = {
      type: 'Event',
      title: 'Quiz',
      descriptionRichText: 'desc',
      descriptionPlainText: 'desc',
      startAtUtc: '2026-04-14T10:00:00.000Z',
      endAtUtc: null,
      timezoneId: 'UTC',
      isAllDay: false,
      relatedPostId: null,
      relatedAssessmentId: null,
    }

    apiRequestMock.mockResolvedValueOnce({} as never)
    await createClassScheduleItemRequest('class-1', scheduleBody)
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/schedule-items', {
      auth: true,
      method: 'POST',
      body: scheduleBody,
    })

    apiRequestMock.mockResolvedValueOnce({} as never)
    await updateClassScheduleItemRequest('class-1', 'schedule-1', scheduleBody)
    expect(apiRequestMock).toHaveBeenLastCalledWith('/classes/class-1/schedule-items/schedule-1', {
      auth: true,
      method: 'PUT',
      body: scheduleBody,
    })
  })
})
