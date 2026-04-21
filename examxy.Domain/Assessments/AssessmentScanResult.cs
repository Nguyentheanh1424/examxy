namespace examxy.Domain.Assessments
{
    public class AssessmentScanResult
    {
        public Guid Id { get; set; }
        public Guid SubmissionId { get; set; }
        public decimal Score { get; set; }
        public int GradedQuestionCount { get; set; }
        public int TotalQuestionCount { get; set; }
        public string? DetectedStudentId { get; set; }
        public string? DetectedQuizId { get; set; }
        public string ConfidenceSummaryJson { get; set; } = "{}";
        public string WarningFlagsJson { get; set; } = "[]";
        public string ConflictFlagsJson { get; set; } = "[]";
        public DateTime CreatedAtUtc { get; set; }

        public AssessmentScanSubmission Submission { get; set; } = null!;
    }
}
