namespace examxy.Domain.ClassContent
{
    public class ClassCommentMentionAll
    {
        public Guid CommentId { get; set; }
        public Guid ClassId { get; set; }
        public string MentionedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ClassComment Comment { get; set; } = null!;
    }
}
