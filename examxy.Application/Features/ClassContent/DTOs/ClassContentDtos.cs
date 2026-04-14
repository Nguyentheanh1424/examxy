namespace examxy.Application.Features.ClassContent.DTOs
{
    public class ClassDashboardDto
    {
        public Guid ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string ClassStatus { get; set; } = string.Empty;
        public string TimezoneId { get; set; } = string.Empty;
        public bool IsTeacherOwner { get; set; }
        public int ActiveStudentCount { get; set; }
        public int FeedItemCount { get; set; }
        public int UpcomingScheduleCount { get; set; }
        public int UnreadNotificationCount { get; set; }
    }

    public class ClassFeedItemDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool AllowComments { get; set; }
        public bool IsPinned { get; set; }
        public bool NotifyAll { get; set; }
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public DateTime? PublishedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public string AuthorUserId { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public IReadOnlyCollection<ClassAttachmentDto> Attachments { get; set; } = Array.Empty<ClassAttachmentDto>();
        public IReadOnlyCollection<ClassCommentDto> Comments { get; set; } = Array.Empty<ClassCommentDto>();
        public ClassReactionSummaryDto Reactions { get; set; } = new();
        public ClassMentionSummaryDto Mentions { get; set; } = new();
    }

    public class ClassPostDto : ClassFeedItemDto
    {
    }

    public class ClassAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
    }

    public class ClassCommentDto
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public string AuthorUserId { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool NotifyAll { get; set; }
        public bool IsHidden { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public ClassReactionSummaryDto Reactions { get; set; } = new();
        public ClassMentionSummaryDto Mentions { get; set; } = new();
    }

    public class ClassReactionSummaryDto
    {
        public string? ViewerReaction { get; set; }
        public int TotalCount { get; set; }
        public IReadOnlyCollection<ReactionCountDto> Counts { get; set; } = Array.Empty<ReactionCountDto>();
    }

    public class ReactionCountDto
    {
        public string ReactionType { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class ClassMentionSummaryDto
    {
        public bool NotifyAll { get; set; }
        public IReadOnlyCollection<string> TaggedUserIds { get; set; } = Array.Empty<string>();
    }

    public class CreateClassPostRequestDto
    {
        public string Type { get; set; } = "Post";
        public string Title { get; set; } = string.Empty;
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool AllowComments { get; set; } = true;
        public bool IsPinned { get; set; }
        public bool NotifyAll { get; set; }
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public IReadOnlyCollection<string> TaggedUserIds { get; set; } = Array.Empty<string>();
        public IReadOnlyCollection<CreateClassAttachmentRequestDto> Attachments { get; set; } = Array.Empty<CreateClassAttachmentRequestDto>();
    }

    public class CreateClassAttachmentRequestDto
    {
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
    }

    public class UpdateClassPostRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool AllowComments { get; set; } = true;
        public bool IsPinned { get; set; }
        public bool NotifyAll { get; set; }
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public string Status { get; set; } = "Draft";
        public IReadOnlyCollection<string> TaggedUserIds { get; set; } = Array.Empty<string>();
    }

    public class CreateClassCommentRequestDto
    {
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool NotifyAll { get; set; }
        public IReadOnlyCollection<string> TaggedUserIds { get; set; } = Array.Empty<string>();
    }

    public class UpdateClassCommentRequestDto
    {
        public string ContentRichText { get; set; } = string.Empty;
        public string ContentPlainText { get; set; } = string.Empty;
        public bool NotifyAll { get; set; }
        public IReadOnlyCollection<string> TaggedUserIds { get; set; } = Array.Empty<string>();
    }

    public class SetReactionRequestDto
    {
        public string? ReactionType { get; set; }
    }

    public class ClassScheduleItemDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public DateTime StartAtUtc { get; set; }
        public DateTime? EndAtUtc { get; set; }
        public string TimezoneId { get; set; } = string.Empty;
        public bool IsAllDay { get; set; }
        public Guid? RelatedPostId { get; set; }
        public Guid? RelatedAssessmentId { get; set; }
    }

    public class CreateClassScheduleItemRequestDto
    {
        public string Type { get; set; } = "Event";
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public DateTime StartAtUtc { get; set; }
        public DateTime? EndAtUtc { get; set; }
        public string TimezoneId { get; set; } = string.Empty;
        public bool IsAllDay { get; set; }
        public Guid? RelatedPostId { get; set; }
        public Guid? RelatedAssessmentId { get; set; }
    }

    public class UpdateClassScheduleItemRequestDto
    {
        public string Type { get; set; } = "Event";
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public DateTime StartAtUtc { get; set; }
        public DateTime? EndAtUtc { get; set; }
        public string TimezoneId { get; set; } = string.Empty;
        public bool IsAllDay { get; set; }
        public Guid? RelatedPostId { get; set; }
        public Guid? RelatedAssessmentId { get; set; }
    }
}
