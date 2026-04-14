using examxy.Domain.QuestionBank;

namespace examxy.Domain.Assessments
{
    public class ClassAssessmentItem
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public int DisplayOrder { get; set; }
        public Guid? SourceQuestionId { get; set; }
        public Guid? SourceQuestionVersionId { get; set; }
        public decimal Points { get; set; }
        public QuestionType SnapshotQuestionType { get; set; }
        public string SnapshotStemRichText { get; set; } = string.Empty;
        public string SnapshotStemPlainText { get; set; } = string.Empty;
        public string SnapshotContentJson { get; set; } = "{}";
        public string SnapshotAnswerKeyJson { get; set; } = "{}";
        public DateTime CreatedAtUtc { get; set; }

        public ClassAssessment Assessment { get; set; } = null!;
    }
}
