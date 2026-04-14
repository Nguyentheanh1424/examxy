namespace examxy.Application.Features.Assessments.DTOs
{
    public class AssessmentDto
    {
        public Guid Id { get; set; }
        public Guid ClassId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public string AssessmentKind { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int AttemptLimit { get; set; }
        public int? TimeLimitMinutes { get; set; }
        public string QuestionOrderMode { get; set; } = string.Empty;
        public string ShowAnswersMode { get; set; } = string.Empty;
        public string ScoreReleaseMode { get; set; } = string.Empty;
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public DateTime? PublishedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public IReadOnlyCollection<AssessmentItemDto> Items { get; set; } = Array.Empty<AssessmentItemDto>();
    }

    public class AssessmentItemDto
    {
        public Guid Id { get; set; }
        public int DisplayOrder { get; set; }
        public Guid? SourceQuestionId { get; set; }
        public Guid? SourceQuestionVersionId { get; set; }
        public decimal Points { get; set; }
        public string SnapshotQuestionType { get; set; } = string.Empty;
        public string SnapshotStemRichText { get; set; } = string.Empty;
        public string SnapshotStemPlainText { get; set; } = string.Empty;
        public string SnapshotContentJson { get; set; } = "{}";
        public string SnapshotAnswerKeyJson { get; set; } = "{}";
    }

    public class CreateAssessmentRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string DescriptionRichText { get; set; } = string.Empty;
        public string DescriptionPlainText { get; set; } = string.Empty;
        public string AssessmentKind { get; set; } = "Practice";
        public int AttemptLimit { get; set; } = 1;
        public int? TimeLimitMinutes { get; set; }
        public string QuestionOrderMode { get; set; } = "Fixed";
        public string ShowAnswersMode { get; set; } = "Hidden";
        public string ScoreReleaseMode { get; set; } = "AfterCloseAt";
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public IReadOnlyCollection<CreateAssessmentItemRequestDto> Items { get; set; } = Array.Empty<CreateAssessmentItemRequestDto>();
    }

    public class CreateAssessmentItemRequestDto
    {
        public int DisplayOrder { get; set; }
        public Guid? SourceQuestionId { get; set; }
        public Guid? SourceQuestionVersionId { get; set; }
        public decimal Points { get; set; } = 1;
        public string SnapshotQuestionType { get; set; } = "SingleChoice";
        public string SnapshotStemRichText { get; set; } = string.Empty;
        public string SnapshotStemPlainText { get; set; } = string.Empty;
        public string SnapshotContentJson { get; set; } = "{}";
        public string SnapshotAnswerKeyJson { get; set; } = "{}";
    }

    public class UpdateAssessmentRequestDto : CreateAssessmentRequestDto
    {
    }

    public class PublishAssessmentRequestDto
    {
        public DateTime? PublishAtUtc { get; set; }
        public DateTime? CloseAtUtc { get; set; }
        public string ShowAnswersMode { get; set; } = "Hidden";
        public string ScoreReleaseMode { get; set; } = "AfterCloseAt";
    }

    public class StudentAssessmentAttemptDto
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public Guid ClassId { get; set; }
        public int AttemptNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime StartedAtUtc { get; set; }
        public DateTime? SubmittedAtUtc { get; set; }
        public DateTime? AutoGradedAtUtc { get; set; }
        public int? TimeLimitMinutesSnapshot { get; set; }
        public decimal MaxScore { get; set; }
        public decimal EarnedScore { get; set; }
        public IReadOnlyCollection<StudentAssessmentAnswerDto> Answers { get; set; } = Array.Empty<StudentAssessmentAnswerDto>();
    }

    public class StudentAssessmentAnswerDto
    {
        public Guid Id { get; set; }
        public Guid AssessmentItemId { get; set; }
        public string QuestionType { get; set; } = string.Empty;
        public string AnswerJson { get; set; } = "{}";
        public bool? IsCorrect { get; set; }
        public decimal EarnedPoints { get; set; }
    }

    public class SaveAttemptAnswersRequestDto
    {
        public IReadOnlyCollection<SaveAnswerItemRequestDto> Items { get; set; } = Array.Empty<SaveAnswerItemRequestDto>();
    }

    public class SaveAnswerItemRequestDto
    {
        public Guid AssessmentItemId { get; set; }
        public string QuestionType { get; set; } = "SingleChoice";
        public string AnswerJson { get; set; } = "{}";
    }
}
