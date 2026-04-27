export interface NotificationInboxItem {
  id: string
  classId: string | null
  recipientUserId: string
  actorUserId: string | null
  notificationType: string
  sourceType: string
  sourceId: string
  title: string
  message: string
  linkPath: string
  featureArea: string
  postId: string | null
  commentId: string | null
  assessmentId: string | null
  scheduleItemId: string | null
  isRead: boolean
  readAtUtc: string | null
  createdAtUtc: string
}

export interface NotificationInboxList {
  unreadCount: number
  items: NotificationInboxItem[]
}

export interface MarkNotificationsReadResult {
  updatedCount: number
  unreadCount: number
}
