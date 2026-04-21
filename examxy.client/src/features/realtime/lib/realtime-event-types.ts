export const realtimeEventTypes = {
  notification: {
    created: 'notification.created',
    read: 'notification.read',
  },
  post: {
    created: 'post.created',
    updated: 'post.updated',
  },
  comment: {
    created: 'comment.created',
    updated: 'comment.updated',
    hidden: 'comment.hidden',
  },
  reaction: {
    postUpdated: 'reaction.post.updated',
    commentUpdated: 'reaction.comment.updated',
  },
} as const

export const realtimeScopeTypes = {
  user: 'user',
  class: 'class',
} as const

export const realtimeHubMethods = {
  receiveRealtimeEvent: 'ReceiveRealtimeEvent',
  subscribeClass: 'SubscribeClass',
  unsubscribeClass: 'UnsubscribeClass',
} as const
