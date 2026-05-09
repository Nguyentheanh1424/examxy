namespace examxy.Domain.QuestionBank
{
    public class QuestionBankExportJob
    {
        public Guid Id { get; set; }
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public QuestionBankExportJobStatus Status { get; set; }
        public string TemplateId { get; set; } = "default-vietnamese-exam";
        public string OptionsJson { get; set; } = "{}";
        public int QuestionCount { get; set; }
        public string GeneratedLatexStorageKey { get; set; } = string.Empty;
        public string PdfStorageKey { get; set; } = string.Empty;
        public string CompileLogStorageKey { get; set; } = string.Empty;
        public string ErrorJson { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? StartedAtUtc { get; set; }
        public DateTime? CompletedAtUtc { get; set; }

        public ICollection<QuestionBankExportJobItem> Items { get; set; } = new List<QuestionBankExportJobItem>();
        public ICollection<QuestionBankExportFile> Files { get; set; } = new List<QuestionBankExportFile>();
    }
}
