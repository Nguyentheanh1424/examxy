namespace examxy.Domain.Assessments
{
    public class PaperExamTemplateAsset
    {
        public Guid Id { get; set; }
        public Guid TemplateVersionId { get; set; }
        public PaperExamTemplateAssetType AssetType { get; set; }
        public string StoragePath { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        public string JsonContent { get; set; } = string.Empty;
        public bool IsRequired { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        public PaperExamTemplateVersion TemplateVersion { get; set; } = null!;
    }
}
