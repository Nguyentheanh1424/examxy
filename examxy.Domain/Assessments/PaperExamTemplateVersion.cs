namespace examxy.Domain.Assessments
{
    public class PaperExamTemplateVersion
    {
        public Guid Id { get; set; }
        public Guid TemplateId { get; set; }
        public int VersionNumber { get; set; }
        public string SchemaVersion { get; set; } = "1.0";
        public string GeometryConfigHash { get; set; } = string.Empty;
        public PaperExamTemplateVersionStatus Status { get; set; }
        public int QuestionCount { get; set; }
        public int OptionsPerQuestion { get; set; }
        public decimal AbsThreshold { get; set; }
        public decimal RelThreshold { get; set; }
        public string ScoringMethod { get; set; } = "annulus_patch_darkness";
        public string ScoringParamsJson { get; set; } = "{}";
        public string PayloadSchemaVersion { get; set; } = "1.0";
        public string? MinClientAppVersion { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? PublishedAtUtc { get; set; }

        public PaperExamTemplate Template { get; set; } = null!;
        public ICollection<PaperExamTemplateAsset> Assets { get; set; } = new List<PaperExamTemplateAsset>();
        public ICollection<PaperExamMetadataField> MetadataFields { get; set; } = new List<PaperExamMetadataField>();
        public ICollection<AssessmentPaperBinding> AssessmentBindings { get; set; } = new List<AssessmentPaperBinding>();
    }
}
