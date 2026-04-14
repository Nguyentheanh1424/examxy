namespace examxy.Domain.ClassContent
{
    public class ClassScheduleItem
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string CreatorUserId { get; set; } = string.Empty;
        public ClassScheduleItemType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public DateTime StartAtUtc { get; set; }
        public DateTime? EndAtUtc { get; set; }
        public string TimezoneId { get; set; } = string.Empty;
        public bool IsAllDay { get; set; }
        public Guid? RelatedPostId { get; set; }
        public Guid? RelatedAssessmentId { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }
    }
}
