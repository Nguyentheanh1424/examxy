namespace examxy.Domain.QuestionBank
{
    public class QuestionBankExportFile
    {
        public Guid Id { get; set; }
        public Guid ExportJobId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public string StorageKey { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public QuestionBankExportJob ExportJob { get; set; } = null!;
    }
}
