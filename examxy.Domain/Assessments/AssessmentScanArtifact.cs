namespace examxy.Domain.Assessments
{
    public class AssessmentScanArtifact
    {
        public Guid Id { get; set; }
        public Guid SubmissionId { get; set; }
        public string ArtifactType { get; set; } = string.Empty;
        public string StoragePath { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public AssessmentScanSubmission Submission { get; set; } = null!;
    }
}
