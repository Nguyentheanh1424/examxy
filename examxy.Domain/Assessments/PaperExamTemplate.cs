namespace examxy.Domain.Assessments
{
    public class PaperExamTemplate
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public PaperExamTemplateStatus Status { get; set; }
        public string PaperSize { get; set; } = "A4";
        public int? OutputWidth { get; set; }
        public int? OutputHeight { get; set; }
        public string MarkerScheme { get; set; } = "custom";
        public bool HasStudentIdField { get; set; }
        public bool HasQuizIdField { get; set; }
        public bool HasHandwrittenRegions { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        public ICollection<PaperExamTemplateVersion> Versions { get; set; } = new List<PaperExamTemplateVersion>();
    }
}
