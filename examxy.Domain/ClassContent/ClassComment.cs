namespace examxy.Domain.ClassContent
{
    public class ClassComment
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid ClassId { get; set; }
        public string AuthorUserId { get; set; } = string.Empty;
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool NotifyAll { get; set; }
        public bool IsHidden { get; set; }
        public string? HiddenByTeacherUserId { get; set; }
        public DateTime? HiddenAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ClassPost Post { get; set; } = null!;
        public ICollection<ClassCommentReaction> Reactions { get; set; } = new List<ClassCommentReaction>();
        public ICollection<ClassCommentMentionUser> MentionedUsers { get; set; } = new List<ClassCommentMentionUser>();
        public ClassCommentMentionAll? MentionAll { get; set; }
    }
}
