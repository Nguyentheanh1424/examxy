namespace examxy.Domain.ClassContent
{
    public class ClassNotification
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string RecipientUserId { get; set; } = string.Empty;
        public string? ActorUserId { get; set; }
        public ClassNotificationType NotificationType { get; set; }
        public ClassNotificationSourceType SourceType { get; set; }
        public Guid SourceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string LinkPath { get; set; } = string.Empty;
        public string PayloadJson { get; set; } = "{}";
        public string NotificationKey { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime? ReadAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
