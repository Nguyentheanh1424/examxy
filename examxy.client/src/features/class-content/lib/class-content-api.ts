import { apiRequest } from '@/lib/http/api-client'
import type {
  ClassComment,
  ClassDashboard,
  ClassFeedItem,
  ClassMentionCandidate,
  ClassReactionSummary,
  ClassScheduleItem,
  CreateClassCommentRequest,
  CreateClassPostRequest,
  CreateClassScheduleItemRequest,
  SetReactionRequest,
  UpdateClassCommentRequest,
  UpdateClassPostRequest,
  UpdateClassScheduleItemRequest,
} from '@/types/class-content'

export function getClassDashboardRequest(classId: string) {
  return apiRequest<ClassDashboard>(`/classes/${classId}/dashboard`, {
    auth: true,
  })
}

export function getClassFeedRequest(classId: string) {
  return apiRequest<ClassFeedItem[]>(`/classes/${classId}/feed`, {
    auth: true,
  })
}

export function getClassMentionCandidatesRequest(classId: string) {
  return apiRequest<ClassMentionCandidate[]>(`/classes/${classId}/mention-candidates`, {
    auth: true,
  })
}

export function createClassPostRequest(
  classId: string,
  request: CreateClassPostRequest,
) {
  return apiRequest<ClassFeedItem>(`/classes/${classId}/posts`, {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function updateClassPostRequest(
  classId: string,
  postId: string,
  request: UpdateClassPostRequest,
) {
  return apiRequest<ClassFeedItem>(`/classes/${classId}/posts/${postId}`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function createClassCommentRequest(
  classId: string,
  postId: string,
  request: CreateClassCommentRequest,
) {
  return apiRequest<ClassComment>(`/classes/${classId}/posts/${postId}/comments`, {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function updateClassCommentRequest(
  classId: string,
  commentId: string,
  request: UpdateClassCommentRequest,
) {
  return apiRequest<ClassComment>(`/classes/${classId}/comments/${commentId}`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function hideClassCommentRequest(classId: string, commentId: string) {
  return apiRequest<void>(`/classes/${classId}/comments/${commentId}`, {
    auth: true,
    method: 'DELETE',
  })
}

export function setPostReactionRequest(
  classId: string,
  postId: string,
  request: SetReactionRequest,
) {
  return apiRequest<ClassReactionSummary>(`/classes/${classId}/posts/${postId}/reaction`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function setCommentReactionRequest(
  classId: string,
  commentId: string,
  request: SetReactionRequest,
) {
  return apiRequest<ClassReactionSummary>(`/classes/${classId}/comments/${commentId}/reaction`, {
    auth: true,
    method: 'PUT',
    body: request,
  })
}

export function getClassScheduleItemsRequest(classId: string) {
  return apiRequest<ClassScheduleItem[]>(`/classes/${classId}/schedule-items`, {
    auth: true,
  })
}

export function createClassScheduleItemRequest(
  classId: string,
  request: CreateClassScheduleItemRequest,
) {
  return apiRequest<ClassScheduleItem>(`/classes/${classId}/schedule-items`, {
    auth: true,
    method: 'POST',
    body: request,
  })
}

export function updateClassScheduleItemRequest(
  classId: string,
  scheduleItemId: string,
  request: UpdateClassScheduleItemRequest,
) {
  return apiRequest<ClassScheduleItem>(
    `/classes/${classId}/schedule-items/${scheduleItemId}`,
    {
      auth: true,
      method: 'PUT',
      body: request,
    },
  )
}
