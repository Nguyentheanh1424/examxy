namespace examxy.Domain.ClassContent
{
    public class ClassCommentMentionUser
    {
        public Guid Id { get; set; }
        public Guid CommentId { get; set; }
        public Guid ClassId { get; set; }
        public string MentionedUserId { get; set; } = string.Empty;
        public string MentionedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ClassComment Comment { get; set; } = null!;
    }
}
