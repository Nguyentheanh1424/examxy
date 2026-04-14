namespace examxy.Domain.ClassContent
{
    public class ClassCommentReaction
    {
        public Guid Id { get; set; }
        public Guid CommentId { get; set; }
        public Guid ClassId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public ClassReactionType ReactionType { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public ClassComment Comment { get; set; } = null!;
    }
}
