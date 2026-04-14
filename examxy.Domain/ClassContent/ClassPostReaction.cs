namespace examxy.Domain.ClassContent
{
    public class ClassPostReaction
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid ClassId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ClassReactionType ReactionType { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public ClassPost Post { get; set; } = null!;
    }
}
