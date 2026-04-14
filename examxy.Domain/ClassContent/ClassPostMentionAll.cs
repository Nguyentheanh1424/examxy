namespace examxy.Domain.ClassContent
{
    public class ClassPostMentionAll
    {
        public Guid PostId { get; set; }
        public Guid ClassId { get; set; }
        public string MentionedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ClassPost Post { get; set; } = null!;
    }
}
