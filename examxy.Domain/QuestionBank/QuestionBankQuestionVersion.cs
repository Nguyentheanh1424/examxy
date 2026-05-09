namespace examxy.Domain.QuestionBank
{
    public class QuestionBankQuestionVersion
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public int VersionNumber { get; set; }
        public QuestionType QuestionType { get; set; }
        public string StemRichText { get; set; } = string.Empty;
        public string StemPlainText { get; set; } = string.Empty;
        public string ExplanationRichText { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public int EstimatedSeconds { get; set; }
        public int ContentSchemaVersion { get; set; } = 1;
        public int AnswerKeySchemaVersion { get; set; } = 1;
        public string RendererVersion { get; set; } = "legacy-v1";
        public string ContentJson { get; set; } = "{}";
        public string AnswerKeyJson { get; set; } = "{}";
        public string ExplanationJson { get; set; } = "{}";
        public string SearchText { get; set; } = string.Empty;
        public string CreatedByUserId { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public QuestionBankQuestion Question { get; set; } = null!;
        public ICollection<QuestionBankAttachment> Attachments { get; set; } = new List<QuestionBankAttachment>();
    }
}
