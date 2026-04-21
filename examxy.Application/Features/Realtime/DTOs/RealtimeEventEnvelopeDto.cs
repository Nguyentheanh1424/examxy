namespace examxy.Application.Features.Realtime.DTOs
{
    public class RealtimeEventEnvelopeDto
    {
        public Guid EventId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public DateTime OccurredAtUtc { get; set; }
        public string Scope { get; set; } = string.Empty;
        public Guid? ClassId { get; set; }
        public string? ActorUserId { get; set; }
        public object? Payload { get; set; }
    }

    public class NotificationReadRealtimePayloadDto
    {
        public IReadOnlyCollection<Guid> NotificationIds { get; set; } = Array.Empty<Guid>();
        public int UnreadCount { get; set; }
        public Guid? ClassId { get; set; }
    }

    public class CommentHiddenRealtimePayloadDto
    {
        public Guid ClassId { get; set; }
        public Guid PostId { get; set; }
        public Guid CommentId { get; set; }
    }

    public class ReactionRealtimePayloadDto
    {
        public Guid ClassId { get; set; }
        public Guid? PostId { get; set; }
        public Guid? CommentId { get; set; }
        public string TargetType { get; set; } = string.Empty;
        public object? Summary { get; set; }
    }
}
