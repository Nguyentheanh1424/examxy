namespace examxy.Application.Abstractions.Classrooms.DTOs
{
    public class ClassInviteDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime SentAtUtc { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? UsedAtUtc { get; set; }
        public string StudentUserId { get; set; } = string.Empty;
        public string UsedByUserId { get; set; } = string.Empty;
    }
}
