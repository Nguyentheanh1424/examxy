namespace examxy.Domain.Assessments
{
    public class AssessmentScanSubmission
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public string StudentUserId { get; set; } = string.Empty;
        public Guid BindingId { get; set; }
        public int BindingVersionUsed { get; set; }
        public string ConfigHashUsed { get; set; } = string.Empty;
        public string ClientSchemaVersion { get; set; } = string.Empty;
        public string? ClientAppVersion { get; set; }
        public string RawScanPayloadJson { get; set; } = "{}";
        public string RawImagePath { get; set; } = string.Empty;
        public AssessmentScanSubmissionStatus Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? FinalizedAtUtc { get; set; }

        public ClassAssessment Assessment { get; set; } = null!;
        public AssessmentPaperBinding Binding { get; set; } = null!;
        public AssessmentScanResult? Result { get; set; }
        public ICollection<AssessmentScanAnswer> Answers { get; set; } = new List<AssessmentScanAnswer>();
        public ICollection<AssessmentScanArtifact> Artifacts { get; set; } = new List<AssessmentScanArtifact>();
    }
}
