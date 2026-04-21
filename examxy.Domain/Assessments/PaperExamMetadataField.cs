namespace examxy.Domain.Assessments
{
    public class PaperExamMetadataField
    {
        public Guid Id { get; set; }
        public Guid TemplateVersionId { get; set; }
        public string FieldCode { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public string DecodeMode { get; set; } = "bubble_grid";
        public string GeometryJson { get; set; } = "{}";
        public string ValidationPolicyJson { get; set; } = "{}";
        public DateTime CreatedAtUtc { get; set; }

        public PaperExamTemplateVersion TemplateVersion { get; set; } = null!;
    }
}
