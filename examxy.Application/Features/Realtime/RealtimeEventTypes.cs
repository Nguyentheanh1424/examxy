namespace examxy.Application.Features.Realtime
{
    public static class RealtimeEventTypes
    {
        public static class Notification
        {
            public const string Created = "notification.created";
            public const string Read = "notification.read";
        }

        public static class Post
        {
            public const string Created = "post.created";
            public const string Updated = "post.updated";
        }

        public static class Comment
        {
            public const string Created = "comment.created";
            public const string Updated = "comment.updated";
            public const string Hidden = "comment.hidden";
        }

        public static class Reaction
        {
            public const string PostUpdated = "reaction.post.updated";
            public const string CommentUpdated = "reaction.comment.updated";
        }
    }
}
