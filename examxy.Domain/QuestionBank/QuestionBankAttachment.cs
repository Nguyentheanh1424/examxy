namespace examxy.Domain.QuestionBank
{
    public class QuestionBankAttachment
    {
        public Guid Id { get; set; }
        public Guid QuestionVersionId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string ExternalUrl { get; set; } = string.Empty;
        public DateTime CreatedAtUtc { get; set; }

        public QuestionBankQuestionVersion QuestionVersion { get; set; } = null!;
    }
}
