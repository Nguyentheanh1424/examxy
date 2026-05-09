namespace examxy.Domain.QuestionBank
{
    public class QuestionBankAttachment
    {
        public Guid Id { get; set; }
        public Guid? QuestionVersionId { get; set; }
        public string OwnerTeacherUserId { get; set; } = string.Empty;
        public Guid? QuestionId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string StorageProvider { get; set; } = "ExternalUrl";
        public string StorageKey { get; set; } = string.Empty;
        public string ExternalUrl { get; set; } = string.Empty;
        public string PublicUrl { get; set; } = string.Empty;
        public string ContentHash { get; set; } = string.Empty;
        public string Status { get; set; } = "PendingUpload";
        public DateTime CreatedAtUtc { get; set; }
        public DateTime? UploadedAtUtc { get; set; }
        public DateTime? DeletedAtUtc { get; set; }

        public QuestionBankQuestionVersion? QuestionVersion { get; set; }
        public QuestionBankQuestion? Question { get; set; }
    }
}
