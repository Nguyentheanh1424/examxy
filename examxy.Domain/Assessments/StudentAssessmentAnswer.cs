using examxy.Domain.QuestionBank;

namespace examxy.Domain.Assessments
{
    public class StudentAssessmentAnswer
    {
        public Guid Id { get; set; }
        public Guid AttemptId { get; set; }
        public Guid AssessmentItemId { get; set; }
        public QuestionType QuestionType { get; set; }
        public string AnswerJson { get; set; } = "{}";
        public bool? IsCorrect { get; set; }
        public decimal EarnedPoints { get; set; }
        public DateTime? AutoGradedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public StudentAssessmentAttempt Attempt { get; set; } = null!;
    }
}
