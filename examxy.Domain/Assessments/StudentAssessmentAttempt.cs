namespace examxy.Domain.Assessments
{
    public class StudentAssessmentAttempt
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public Guid ClassId { get; set; }
        public string StudentUserId { get; set; } = string.Empty;
        public int AttemptNumber { get; set; }
        public StudentAssessmentAttemptStatus Status { get; set; }
        public DateTime StartedAtUtc { get; set; }
        public DateTime? SubmittedAtUtc { get; set; }
        public DateTime? AutoGradedAtUtc { get; set; }
        public int? TimeLimitMinutesSnapshot { get; set; }
        public decimal MaxScore { get; set; }
        public decimal EarnedScore { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public ClassAssessment Assessment { get; set; } = null!;
        public ICollection<StudentAssessmentAnswer> Answers { get; set; } = new List<StudentAssessmentAnswer>();
    }
}
