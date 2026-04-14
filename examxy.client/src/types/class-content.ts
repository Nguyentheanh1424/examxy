export interface ClassDashboard {
  classId: string
  className: string
  classCode: string
  classStatus: string
  timezoneId: string
  isTeacherOwner: boolean
  activeStudentCount: number
  feedItemCount: number
  upcomingScheduleCount: number
  unreadNotificationCount: number
}

export interface ClassAttachment {
  id: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  externalUrl: string
}

export interface ReactionCount {
  reactionType: string
  count: number
}

export interface ClassReactionSummary {
  viewerReaction: string | null
  totalCount: number
  counts: ReactionCount[]
}

export interface ClassMentionSummary {
  notifyAll: boolean
  taggedUserIds: string[]
}

export interface ClassComment {
  id: string
  postId: string
  authorUserId: string
  authorName: string
  contentRichText: string
  contentPlainText: string
  notifyAll: boolean
  isHidden: boolean
  createdAtUtc: string
  updatedAtUtc: string
  reactions: ClassReactionSummary
  mentions: ClassMentionSummary
}

export interface ClassFeedItem {
  id: string
  type: string
  status: string
  title: string
  contentRichText: string
  contentPlainText: string
  allowComments: boolean
  isPinned: boolean
  notifyAll: boolean
  publishAtUtc: string | null
  closeAtUtc: string | null
  publishedAtUtc: string | null
  createdAtUtc: string
  updatedAtUtc: string
  authorUserId: string
  authorName: string
  attachments: ClassAttachment[]
  comments: ClassComment[]
  reactions: ClassReactionSummary
  mentions: ClassMentionSummary
}

export interface ClassScheduleItem {
  id: string
  type: string
  title: string
  descriptionRichText: string
  descriptionPlainText: string
  startAtUtc: string
  endAtUtc: string | null
  timezoneId: string
  isAllDay: boolean
  relatedPostId: string | null
  relatedAssessmentId: string | null
}

export interface ClassMentionCandidate {
  userId: string
  displayName: string
  email: string
}

export interface CreateClassAttachmentRequest {
  fileName: string
  contentType: string
  fileSizeBytes: number
  externalUrl: string
}

export interface CreateClassPostRequest {
  type: string
  title: string
  contentRichText: string
  contentPlainText: string
  allowComments: boolean
  isPinned: boolean
  notifyAll: boolean
  publishAtUtc: string | null
  closeAtUtc: string | null
  taggedUserIds: string[]
  attachments: CreateClassAttachmentRequest[]
}

export interface UpdateClassPostRequest {
  title: string
  contentRichText: string
  contentPlainText: string
  allowComments: boolean
  isPinned: boolean
  notifyAll: boolean
  publishAtUtc: string | null
  closeAtUtc: string | null
  status: string
  taggedUserIds: string[]
}

export interface CreateClassCommentRequest {
  contentRichText: string
  contentPlainText: string
  notifyAll: boolean
  taggedUserIds: string[]
}

export interface UpdateClassCommentRequest {
  contentRichText: string
  contentPlainText: string
  notifyAll: boolean
  taggedUserIds: string[]
}

export interface SetReactionRequest {
  reactionType: string | null
}

export interface CreateClassScheduleItemRequest {
  type: string
  title: string
  descriptionRichText: string
  descriptionPlainText: string
  startAtUtc: string
  endAtUtc: string | null
  timezoneId: string
  isAllDay: boolean
  relatedPostId: string | null
  relatedAssessmentId: string | null
}

export type UpdateClassScheduleItemRequest = CreateClassScheduleItemRequest
