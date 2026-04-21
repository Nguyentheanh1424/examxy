namespace examxy.Application.Features.Notifications.DTOs
{
    public class NotificationInboxListDto
    {
        public int UnreadCount { get; set; }
        public IReadOnlyCollection<NotificationInboxItemDto> Items { get; set; } = Array.Empty<NotificationInboxItemDto>();
    }

    public class NotificationInboxItemDto
    {
        public Guid Id { get; set; }
        public Guid? ClassId { get; set; }
        public string RecipientUserId { get; set; } = string.Empty;
        public string? ActorUserId { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        public string SourceType { get; set; } = string.Empty;
        public Guid SourceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string LinkPath { get; set; } = string.Empty;
        public string FeatureArea { get; set; } = string.Empty;
        public Guid? PostId { get; set; }
        public Guid? CommentId { get; set; }
        public Guid? AssessmentId { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }

    public class MarkNotificationsReadResultDto
    {
        public int UpdatedCount { get; set; }
        public int UnreadCount { get; set; }
    }
}
