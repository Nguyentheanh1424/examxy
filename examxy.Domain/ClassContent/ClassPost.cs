namespace examxy.Domain.ClassContent
{
    public class ClassPost
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string AuthorUserId { get; set; } = string.Empty;
        public ClassPostType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public ClassPostStatus Status { get; set; }
        public bool AllowComments { get; set; }
        public bool IsPinned { get; set; }
        public bool NotifyAll { get; set; }
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public DateTime? PublishedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ICollection<ClassPostAttachment> Attachments { get; set; } = new List<ClassPostAttachment>();
        public ICollection<ClassComment> Comments { get; set; } = new List<ClassComment>();
        public ICollection<ClassPostReaction> Reactions { get; set; } = new List<ClassPostReaction>();
        public ICollection<ClassPostMentionUser> MentionedUsers { get; set; } = new List<ClassPostMentionUser>();
        public ClassPostMentionAll? MentionAll { get; set; }
    }
}
