namespace examxy.Domain.Assessments
{
    public class ClassAssessment
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public AssessmentKind AssessmentKind { get; set; }
        public AssessmentStatus Status { get; set; }
        public int AttemptLimit { get; set; }
        public int? TimeLimitMinutes { get; set; }
        public AssessmentQuestionOrderMode QuestionOrderMode { get; set; }
        public AssessmentShowAnswersMode ShowAnswersMode { get; set; }
        public AssessmentScoreReleaseMode ScoreReleaseMode { get; set; }
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public DateTime? PublishedAtUtc { get; set; }
        public DateTime? ScoresReleasedAtUtc { get; set; }
        public DateTime? AnswersReleasedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public ICollection<ClassAssessmentItem> Items { get; set; } = new List<ClassAssessmentItem>();
        public ICollection<StudentAssessmentAttempt> Attempts { get; set; } = new List<StudentAssessmentAttempt>();
        public ICollection<AssessmentPaperBinding> PaperBindings { get; set; } = new List<AssessmentPaperBinding>();
        public ICollection<AssessmentScanSubmission> ScanSubmissions { get; set; } = new List<AssessmentScanSubmission>();
    }
}
