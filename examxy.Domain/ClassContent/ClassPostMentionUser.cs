namespace examxy.Domain.ClassContent
{
    public class ClassPostMentionUser
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid ClassId { get; set; }
        public string MentionedUserId { get; set; } = string.Empty;
        public string MentionedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ClassPost Post { get; set; } = null!;
    }
}
