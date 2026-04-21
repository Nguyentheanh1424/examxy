namespace examxy.Domain.Assessments
{
    public class AssessmentScanAnswer
    {
        public Guid Id { get; set; }
        public Guid SubmissionId { get; set; }
        public Guid AssessmentItemId { get; set; }
        public int QuestionNumber { get; set; }
        public string DetectedOption { get; set; } = string.Empty;
        public string DetectedAnswerJson { get; set; } = "{}";
        public bool? IsCorrect { get; set; }
        public decimal EarnedPoints { get; set; }
        public string ConfidenceJson { get; set; } = "{}";
        public DateTime CreatedAtUtc { get; set; }

        public AssessmentScanSubmission Submission { get; set; } = null!;
    }
}
