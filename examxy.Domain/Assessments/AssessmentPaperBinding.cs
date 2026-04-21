namespace examxy.Domain.Assessments
{
    public class AssessmentPaperBinding
    {
        public Guid Id { get; set; }
        public Guid AssessmentId { get; set; }
        public Guid TemplateVersionId { get; set; }
        public int BindingVersion { get; set; }
        public string ConfigHash { get; set; } = string.Empty;
        public string AnswerMapJson { get; set; } = "[]";
        public string MetadataPolicyJson { get; set; } = "{}";
        public string SubmissionPolicyJson { get; set; } = "{}";
        public string ReviewPolicyJson { get; set; } = "{}";
        public AssessmentPaperBindingStatus Status { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public ClassAssessment Assessment { get; set; } = null!;
        public PaperExamTemplateVersion TemplateVersion { get; set; } = null!;
        public ICollection<AssessmentScanSubmission> ScanSubmissions { get; set; } = new List<AssessmentScanSubmission>();
    }
}
